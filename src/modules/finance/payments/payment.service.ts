import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    UnprocessableEntityException,
  } from '@nestjs/common';
  import { PrismaService } from '../../../shared/prisma/prisma.service';
  import { AuditTrailService } from '../../../shared/audit/audit-trail.service';
  import { FinanceGateway } from '../../../shared/socket/finance.gateway';
  import { InvoiceService } from '../invoices/invoice.service';
  import { RecordPaymentDto, PaymentFilterDto } from './dto/payment.dto';
  import {
    AuditAction,
    InvoiceStatus,
    PaymentMode,
  } from '../../../common/enums';
  import { AuditContext, PaginationMeta } from '../../../common/interfaces';
  import { SOCKET_EVENTS } from '../../../common/constants';
  import { Prisma } from '@prisma/client';
  
  @Injectable()
  export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
  
    constructor(
      private readonly prisma: PrismaService,
      private readonly audit: AuditTrailService,
      private readonly gateway: FinanceGateway,
      private readonly invoiceService: InvoiceService,
    ) {}
  
    async recordPayment(
      dto: RecordPaymentDto,
      userId: string,
      context: AuditContext,
    ) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.invoiceId },
        include: { customer: true },
      });
  
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
  
      const eligibleStatuses: string[] = [
        InvoiceStatus.SENT,
        InvoiceStatus.PARTIAL,
        InvoiceStatus.OVERDUE,
      ];
      if (!eligibleStatuses.includes(invoice.status)) {
        throw new UnprocessableEntityException(
          `Invoice is not eligible for payment. Current status: ${invoice.status}`,
        );
      }
  
      const amountDue = Number(invoice.amountDue);
      if (dto.amount > amountDue + 0.01) {
        throw new UnprocessableEntityException(
          `Payment amount ₹${dto.amount} exceeds outstanding balance ₹${amountDue}`,
        );
      }
  
      if (
        dto.utrNumber &&
        (dto.paymentMode === PaymentMode.UPI ||
          dto.paymentMode === PaymentMode.BANK_TRANSFER)
      ) {
        const existingUtr = await this.prisma.payment.findUnique({
          where: { utrNumber: dto.utrNumber },
        });
        if (existingUtr) {
          throw new ConflictException(
            `UTR number ${dto.utrNumber} has already been recorded`,
          );
        }
      }
  
      const paymentDate = new Date(dto.paymentDate);
      if (paymentDate > new Date()) {
        throw new UnprocessableEntityException(
          'Payment date cannot be in the future',
        );
      }
      if (paymentDate < invoice.issueDate) {
        throw new UnprocessableEntityException(
          'Payment date cannot be before invoice issue date',
        );
      }
  
      const paymentNumber = await this.invoiceService.generateDocumentNumber('payment');
      const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
      const grandTotal = Number(invoice.grandTotal);
  
      let newStatus: InvoiceStatus;
      if (Math.abs(newAmountPaid - grandTotal) < 0.01) {
        newStatus = InvoiceStatus.PAID;
      } else {
        newStatus = InvoiceStatus.PARTIAL;
      }
  
      const payment = await this.prisma.$transaction(async (tx) => {
        const created = await tx.payment.create({
          data: {
            paymentNumber,
            invoiceId: dto.invoiceId,
            amount: dto.amount,
            paymentMode: dto.paymentMode,
            utrNumber: dto.utrNumber || null,
            chequeNumber: dto.chequeNumber || null,
            bankName: dto.bankName || null,
            status: 'settled',
            paymentDate,
            remarks: dto.remarks || null,
            recordedBy: userId,
          },
        });
  
        await tx.invoice.update({
          where: { id: dto.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            amountDue: grandTotal - newAmountPaid,
            status: newStatus,
          },
        });
  
        return created;
      });
  
      await this.audit.logSuccess(
        AuditAction.PAYMENT_RECORDED,
        'payment',
        payment.id,
        `Payment ${paymentNumber} of ₹${dto.amount} recorded against invoice ${invoice.invoiceNumber}`,
        context,
      );
  
      if (newStatus === InvoiceStatus.PAID) {
        this.gateway.emit(SOCKET_EVENTS.INVOICE_PAID, {
          invoiceId: dto.invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          amountPaid: newAmountPaid,
        });
      } else {
        this.gateway.emit(SOCKET_EVENTS.PAYMENT_RECORDED, {
          paymentId: payment.id,
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          newStatus,
        });
      }
  
      if (dto.utrNumber) {
        await this.attemptAutoReconciliation(
          payment.id,
          dto.utrNumber,
          dto.amount,
          paymentDate,
          dto.invoiceId,
          context,
        );
      }
  
      return payment;
    }
  
    async findAll(filter: PaymentFilterDto) {
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const skip = (page - 1) * limit;
  
      const where: Prisma.PaymentWhereInput = {};
  
      if (filter.status) where.status = filter.status as never;
      if (filter.paymentMode) where.paymentMode = filter.paymentMode as PaymentMode;
      if (filter.fromDate || filter.toDate) {
        where.paymentDate = {
          ...(filter.fromDate && { gte: new Date(filter.fromDate) }),
          ...(filter.toDate && { lte: new Date(filter.toDate) }),
        };
      }
      if (filter.search) {
        where.OR = [
          { paymentNumber: { contains: filter.search, mode: 'insensitive' } },
          { utrNumber: { contains: filter.search, mode: 'insensitive' } },
          {
            invoice: {
              invoiceNumber: { contains: filter.search, mode: 'insensitive' },
            },
          },
          {
            invoice: {
              customer: {
                name: { contains: filter.search, mode: 'insensitive' },
              },
            },
          },
        ];
      }
  
      const [payments, total] = await this.prisma.$transaction([
        this.prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
                customer: { select: { name: true } },
              },
            },
          },
        }),
        this.prisma.payment.count({ where }),
      ]);
  
      const pagination: PaginationMeta = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      };
  
      return { payments, pagination };
    }
  
    async getReceipt(paymentId: string) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
        },
      });
  
      if (!payment) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }
  
      return {
        receiptNumber: payment.paymentNumber.replace('PAY', 'RCP'),
        paymentId: payment.id,
        paymentNumber: payment.paymentNumber,
        invoiceNumber: payment.invoice.invoiceNumber,
        customerName: payment.invoice.customer.name,
        customerGstin: payment.invoice.customer.gstin,
        amount: Number(payment.amount),
        paymentMode: payment.paymentMode,
        paymentDate: payment.paymentDate,
        utrNumber: payment.utrNumber,
        bankName: payment.bankName,
        status: payment.status,
      };
    }
  
    private async attemptAutoReconciliation(
      paymentId: string,
      utrNumber: string,
      amount: number,
      paymentDate: Date,
      invoiceId: string,
      context: AuditContext,
    ): Promise<void> {
      try {
        const bankEntry = await this.prisma.bankReconciliationEntry.findUnique({
          where: { utrNumber },
        });
  
        if (bankEntry && !bankEntry.isReconciled) {
          const amountMatch = Math.abs(Number(bankEntry.amount) - amount) < 0.01;
          const daysDiff = Math.abs(
            (bankEntry.transactionDate.getTime() - paymentDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const dateProximity = daysDiff <= 3;
  
          if (amountMatch && dateProximity) {
            await this.prisma.bankReconciliationEntry.update({
              where: { id: bankEntry.id },
              data: {
                isReconciled: true,
                matchedInvoiceId: invoiceId,
                matchedPaymentId: paymentId,
                reconciledBy: context.userId || null,
                reconciledAt: new Date(),
              },
            });
  
            await this.audit.logSuccess(
              AuditAction.RECONCILIATION_MATCHED,
              'bank_reconciliation',
              bankEntry.id,
              `Auto-reconciled bank entry UTR:${utrNumber} with payment ${paymentId} (confidence: 100%)`,
              context,
            );
          }
        }
      } catch (err) {
        this.logger.warn(
          `Auto-reconciliation skipped for UTR ${utrNumber}: ${(err as Error).message}`,
        );
      }
    }
  }