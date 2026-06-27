import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    UnprocessableEntityException,
  } from '@nestjs/common';
  import { PrismaService } from '../../../shared/prisma/prisma.service';
  import { AuditTrailService } from '../../../shared/audit/audit-trail.service';
  import { GSTCalculationEngine } from './gst-calculation.engine';
  import { FinanceGateway } from '../../../shared/socket/finance.gateway';
  import {
    CreateInvoiceDto,
    CreateCreditNoteDto,
    CreateDebitNoteDto,
    UpdateInvoiceDto,
    InvoiceFilterDto,
  } from './dto/invoice.dto';
  import {
    AuditAction,
    AuditSeverity,
    InvoiceStatus,
  } from '../../../common/enums';
  import { AuditContext, PaginationMeta } from '../../../common/interfaces';
  import {
    INVOICE_FUTURE_DAYS_ALLOWED,
    INVOICE_MAX_DUE_DAYS,
    SOCKET_EVENTS,
  } from '../../../common/constants';
  import { Prisma } from '@prisma/client';
  
  @Injectable()
  export class InvoiceService {
    private readonly logger = new Logger(InvoiceService.name);
  
    constructor(
      private readonly prisma: PrismaService,
      private readonly audit: AuditTrailService,
      private readonly gstEngine: GSTCalculationEngine,
      private readonly gateway: FinanceGateway,
    ) {}
  
    async create(
      dto: CreateInvoiceDto,
      userId: string,
      context: AuditContext,
    ) {
      this.validateInvoiceDates(dto.issueDate, dto.dueDate);
  
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
  
      const interState = this.gstEngine.isInterState(customer.gstin);
      const { lineCalculations, subtotal, totalGst, grandTotal } =
        this.gstEngine.calculateInvoiceTotals(dto.lineItems, interState);
  
      if (grandTotal <= 0) {
        throw new UnprocessableEntityException('Invoice total cannot be zero');
      }
  
      const invoiceNumber = await this.generateInvoiceNumber();
  
      const invoice = await this.prisma.$transaction(async (tx) => {
        const created = await tx.invoice.create({
          data: {
            invoiceNumber,
            customerId: dto.customerId,
            status: InvoiceStatus.DRAFT,
            issueDate: new Date(dto.issueDate),
            dueDate: new Date(dto.dueDate),
            subtotal,
            totalGst,
            grandTotal,
            amountPaid: 0,
            amountDue: grandTotal,
            isInterState: interState,
            paymentMode: dto.paymentMode ?? undefined,
            notes: dto.notes,
            terms: dto.terms,
            createdBy: userId,
            lineItems: {
              create: dto.lineItems.map((item, idx) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                gstRate: item.gstRate,
                taxableAmt: lineCalculations[idx].taxableAmt,
                cgst: lineCalculations[idx].cgst,
                sgst: lineCalculations[idx].sgst,
                igst: lineCalculations[idx].igst,
                gstAmount: lineCalculations[idx].gstAmount,
                total: lineCalculations[idx].total,
                sortOrder: item.sortOrder ?? idx,
              })),
            },
          },
          include: { lineItems: true, customer: true },
        });
        return created;
      });
  
      await this.audit.logSuccess(
        AuditAction.INVOICE_CREATED,
        'invoice',
        invoice.id,
        `Invoice ${invoiceNumber} created for ${customer.name} — ₹${grandTotal}`,
        context,
      );
  
      this.gateway.emit(SOCKET_EVENTS.INVOICE_CREATED, {
        invoiceId: invoice.id,
        invoiceNumber,
        grandTotal,
        customerId: dto.customerId,
      });
  
      return invoice;
    }
  
    async findAll(filter: InvoiceFilterDto) {
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const skip = (page - 1) * limit;
  
      const where: Prisma.InvoiceWhereInput = {};
  
      if (filter.status) {
        where.status = filter.status as InvoiceStatus;
      }
      if (filter.customerId) {
        where.customerId = filter.customerId;
      }
      if (filter.fromDate || filter.toDate) {
        where.issueDate = {
          ...(filter.fromDate && { gte: new Date(filter.fromDate) }),
          ...(filter.toDate && { lte: new Date(filter.toDate) }),
        };
      }
      if (filter.search) {
        where.OR = [
          { invoiceNumber: { contains: filter.search, mode: 'insensitive' } },
          { customer: { name: { contains: filter.search, mode: 'insensitive' } } },
          { notes: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
  
      const [invoices, total] = await this.prisma.$transaction([
        this.prisma.invoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { id: true, name: true, gstin: true } },
            lineItems: true,
          },
        }),
        this.prisma.invoice.count({ where }),
      ]);
  
      const pagination: PaginationMeta = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      };
  
      return { invoices, pagination };
    }
  
    async findOne(id: string) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
        include: {
          lineItems: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          payments: { where: { status: 'settled' } },
          creditNotes: true,
          dunningRecords: { orderBy: { actionDate: 'desc' }, take: 5 },
        },
      });
  
      if (!invoice) {
        throw new NotFoundException(`Invoice ${id} not found`);
      }
  
      return invoice;
    }
  
    async update(
      id: string,
      dto: UpdateInvoiceDto,
      userId: string,
      context: AuditContext,
    ) {
      const invoice = await this.findOne(id);
  
      if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new UnprocessableEntityException(
          'Only draft invoices can be edited',
        );
      }
  
      let updateData: Prisma.InvoiceUpdateInput = {};
      let lineItemOps: Prisma.InvoiceUpdateInput = {};
  
      if (dto.dueDate) {
        this.validateInvoiceDates(
          invoice.issueDate.toISOString().split('T')[0],
          dto.dueDate,
        );
        updateData.dueDate = new Date(dto.dueDate);
      }
  
      if (dto.paymentMode !== undefined) updateData.paymentMode = dto.paymentMode;
      if (dto.notes !== undefined) updateData.notes = dto.notes;
      if (dto.terms !== undefined) updateData.terms = dto.terms;
  
      if (dto.lineItems && dto.lineItems.length > 0) {
        const customer = await this.prisma.customer.findUnique({
          where: { id: invoice.customerId },
        });
        const interState = this.gstEngine.isInterState(customer?.gstin);
        const { lineCalculations, subtotal, totalGst, grandTotal } =
          this.gstEngine.calculateInvoiceTotals(dto.lineItems, interState);
  
        updateData = {
          ...updateData,
          subtotal,
          totalGst,
          grandTotal,
          amountDue: grandTotal,
        };
  
        lineItemOps = {
          lineItems: {
            deleteMany: {},
            create: dto.lineItems.map((item, idx) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              gstRate: item.gstRate,
              taxableAmt: lineCalculations[idx].taxableAmt,
              cgst: lineCalculations[idx].cgst,
              sgst: lineCalculations[idx].sgst,
              igst: lineCalculations[idx].igst,
              gstAmount: lineCalculations[idx].gstAmount,
              total: lineCalculations[idx].total,
              sortOrder: item.sortOrder ?? idx,
            })),
          },
        };
      }
  
      const updated = await this.prisma.invoice.update({
        where: { id },
        data: { ...updateData, ...lineItemOps },
        include: { lineItems: true, customer: true },
      });
  
      await this.audit.logInfo(
        'INVOICE_UPDATED',
        'invoice',
        id,
        `Invoice ${invoice.invoiceNumber} updated by user ${userId}`,
        context,
      );
  
      return updated;
    }
  
    async sendInvoice(id: string, userId: string, context: AuditContext) {
      const invoice = await this.findOne(id);
  
      if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new UnprocessableEntityException(
          `Invoice cannot be sent — current status is '${invoice.status}'`,
        );
      }
  
      const updated = await this.prisma.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.SENT, sentAt: new Date() },
        include: { customer: true },
      });
  
      await this.audit.logSuccess(
        AuditAction.INVOICE_SENT,
        'invoice',
        id,
        `Invoice ${invoice.invoiceNumber} sent to ${invoice.customer.email} by user ${userId}`,
        context,
      );
  
      return updated;
    }
  
    async createCreditNote(
      dto: CreateCreditNoteDto,
      userId: string,
      context: AuditContext,
    ) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.originalInvoiceId },
        include: { customer: true },
      });
      if (!invoice) {
        throw new NotFoundException('Original invoice not found');
      }
  
      const interState = this.gstEngine.isInterState(invoice.customer.gstin);
      const { lineCalculations, subtotal, totalGst, grandTotal } =
        this.gstEngine.calculateInvoiceTotals(dto.lineItems, interState);
  
      const cnNumber = await this.generateDocumentNumber('credit_note');
  
      const creditNote = await this.prisma.creditNote.create({
        data: {
          creditNoteNumber: cnNumber,
          originalInvoiceId: dto.originalInvoiceId,
          customerId: invoice.customerId,
          reason: dto.reason,
          subtotal,
          gstAmount: totalGst,
          grandTotal,
          date: new Date(dto.date),
          createdBy: userId,
        },
      });
  
      await this.audit.logInfo(
        AuditAction.CREDIT_NOTE_CREATED,
        'credit_note',
        creditNote.id,
        `Credit note ${cnNumber} created against invoice ${invoice.invoiceNumber} — ₹${grandTotal}`,
        context,
      );
  
      return creditNote;
    }
  
    async listCreditNotes() {
      return this.prisma.creditNote.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          originalInvoice: { select: { id: true, invoiceNumber: true } },
        },
      });
    }
  
    async createDebitNote(
      dto: CreateDebitNoteDto,
      userId: string,
      context: AuditContext,
    ) {
      const { lineCalculations, subtotal, totalGst, grandTotal } =
        this.gstEngine.calculateInvoiceTotals(dto.lineItems, false);
  
      const dnNumber = await this.generateDocumentNumber('debit_note');
  
      const debitNote = await this.prisma.debitNote.create({
        data: {
          debitNoteNumber: dnNumber,
          originalInvoiceId: dto.originalInvoiceId,
          vendorId: dto.vendorId,
          reason: dto.reason,
          subtotal,
          gstAmount: totalGst,
          grandTotal,
          date: new Date(dto.date),
          createdBy: userId,
        },
      });
  
      await this.audit.logInfo(
        AuditAction.DEBIT_NOTE_CREATED,
        'debit_note',
        debitNote.id,
        `Debit note ${dnNumber} created — ₹${grandTotal}`,
        context,
      );
  
      return debitNote;
    }
  
    async listDebitNotes() {
      return this.prisma.debitNote.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, name: true } },
          originalInvoice: { select: { id: true, invoiceNumber: true } },
        },
      });
    }
  
    private validateInvoiceDates(issueDate: string, dueDate: string): void {
      const issue = new Date(issueDate);
      const due = new Date(dueDate);
      const today = new Date();
  
      const maxFutureDate = new Date();
      maxFutureDate.setDate(today.getDate() + INVOICE_FUTURE_DAYS_ALLOWED);
  
      if (issue > maxFutureDate) {
        throw new BadRequestException(
          `Issue date cannot be more than ${INVOICE_FUTURE_DAYS_ALLOWED} days in the future`,
        );
      }
  
      if (due < issue) {
        throw new BadRequestException('Due date must be after issue date');
      }
  
      const diffDays = Math.floor(
        (due.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays > INVOICE_MAX_DUE_DAYS) {
        throw new BadRequestException(
          `Due date cannot be more than ${INVOICE_MAX_DUE_DAYS} days from issue date`,
        );
      }
    }
  
    private async generateInvoiceNumber(): Promise<string> {
      return this.generateDocumentNumber('invoice');
    }
  
    async generateDocumentNumber(entity: string): Promise<string> {
      const seq = await this.prisma.$transaction(async (tx) => {
        const record = await tx.numberingSequence.findUnique({
          where: { entity },
        });
  
        if (!record) {
          throw new ConflictException(`Numbering sequence not found for: ${entity}`);
        }
  
        const updated = await tx.numberingSequence.update({
          where: { entity },
          data: { nextNo: { increment: 1 } },
        });
  
        return { prefix: record.prefix, nextNo: record.nextNo };
      });
  
      const year = new Date().getFullYear();
      return `${seq.prefix}-${year}-${String(seq.nextNo).padStart(4, '0')}`;
    }
  }