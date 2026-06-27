import {
    Injectable,
    Logger,
    NotFoundException,
    UnprocessableEntityException,
  } from '@nestjs/common';
  import { PrismaService } from '../../../shared/prisma/prisma.service';
  import { AuditTrailService } from '../../../shared/audit/audit-trail.service';
  import {
    MatchReconciliationDto,
    ReconciliationFilterDto,
  } from './dto/reconciliation.dto';
  import { AuditAction } from '../../../common/enums';
  import { AuditContext, PaginationMeta } from '../../../common/interfaces';
  import { Prisma } from '@prisma/client';
  
  @Injectable()
  export class ReconciliationService {
    private readonly logger = new Logger(ReconciliationService.name);
  
    constructor(
      private readonly prisma: PrismaService,
      private readonly audit: AuditTrailService,
    ) {}
  
    async findAll(filter: ReconciliationFilterDto) {
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const skip = (page - 1) * limit;
  
      const where: Prisma.BankReconciliationEntryWhereInput = {};
  
      if (filter.reconciled !== undefined) {
        where.isReconciled = filter.reconciled === 'true';
      }
  
      const [entries, total] = await this.prisma.$transaction([
        this.prisma.bankReconciliationEntry.findMany({
          where,
          skip,
          take: limit,
          orderBy: { transactionDate: 'desc' },
          include: {
            matchedInvoice: {
              select: { invoiceNumber: true, customer: { select: { name: true } } },
            },
            matchedPayment: { select: { paymentNumber: true } },
          },
        }),
        this.prisma.bankReconciliationEntry.count({ where }),
      ]);
  
      const pagination: PaginationMeta = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      };
  
      return { entries, pagination };
    }
  
    async matchEntry(
      entryId: string,
      dto: MatchReconciliationDto,
      userId: string,
      context: AuditContext,
    ) {
      const entry = await this.prisma.bankReconciliationEntry.findUnique({
        where: { id: entryId },
      });
      if (!entry) {
        throw new NotFoundException('Bank reconciliation entry not found');
      }
      if (entry.isReconciled) {
        throw new UnprocessableEntityException(
          'Entry is already reconciled. Unmatch first before re-matching.',
        );
      }
  
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.invoiceId },
        include: { customer: true },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
  
      const amountDifference = Math.abs(
        Number(entry.amount) - Number(invoice.grandTotal),
      );
      if (amountDifference > Number(invoice.grandTotal) * 0.05) {
        throw new UnprocessableEntityException(
          `Amount mismatch: bank entry ₹${entry.amount} vs invoice total ₹${invoice.grandTotal}. Difference exceeds 5%.`,
        );
      }
  
      const updated = await this.prisma.bankReconciliationEntry.update({
        where: { id: entryId },
        data: {
          isReconciled: true,
          matchedInvoiceId: dto.invoiceId,
          reconciledBy: userId,
          reconciledAt: new Date(),
        },
        include: {
          matchedInvoice: {
            select: { invoiceNumber: true, customer: { select: { name: true } } },
          },
        },
      });
  
      await this.audit.logSuccess(
        AuditAction.RECONCILIATION_MATCHED,
        'bank_reconciliation',
        entryId,
        `Bank entry UTR:${entry.utrNumber} manually matched to invoice ${invoice.invoiceNumber} by user ${userId}`,
        context,
      );
  
      return updated;
    }
  
    async unmatchEntry(
      entryId: string,
      userId: string,
      context: AuditContext,
    ) {
      const entry = await this.prisma.bankReconciliationEntry.findUnique({
        where: { id: entryId },
      });
      if (!entry) {
        throw new NotFoundException('Bank reconciliation entry not found');
      }
      if (!entry.isReconciled) {
        throw new UnprocessableEntityException('Entry is not currently reconciled');
      }
  
      const updated = await this.prisma.bankReconciliationEntry.update({
        where: { id: entryId },
        data: {
          isReconciled: false,
          matchedInvoiceId: null,
          matchedPaymentId: null,
          reconciledBy: null,
          reconciledAt: null,
        },
      });
  
      await this.audit.logWarning(
        AuditAction.RECONCILIATION_UNMATCHED,
        'bank_reconciliation',
        entryId,
        `Bank entry UTR:${entry.utrNumber} unmatched by user ${userId}`,
        context,
      );
  
      return updated;
    }
  
    async getUnmatchedAlertsCount(): Promise<number> {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
      return this.prisma.bankReconciliationEntry.count({
        where: {
          isReconciled: false,
          transactionDate: { lte: thirtyDaysAgo },
        },
      });
    }
  
    async suggestMatches(entryId: string) {
      const entry = await this.prisma.bankReconciliationEntry.findUnique({
        where: { id: entryId },
      });
      if (!entry) {
        throw new NotFoundException('Bank reconciliation entry not found');
      }
  
      const threeDaysAgo = new Date(entry.transactionDate);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAhead = new Date(entry.transactionDate);
      threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);
  
      const amount = Number(entry.amount);
      const tolerance = amount * 0.01;
  
      const suggestions = await this.prisma.invoice.findMany({
        where: {
          amountDue: {
            gte: amount - tolerance,
            lte: amount + tolerance,
          },
          status: { in: ['sent', 'partial', 'overdue'] },
          dueDate: {
            gte: threeDaysAgo,
            lte: threeDaysAhead,
          },
        },
        include: { customer: { select: { name: true } } },
        take: 5,
      });
  
      const utrMatch = await this.prisma.payment.findUnique({
        where: { utrNumber: entry.utrNumber },
        include: { invoice: { select: { invoiceNumber: true } } },
      });
  
      return {
        entryId,
        utrNumber: entry.utrNumber,
        amount: Number(entry.amount),
        transactionDate: entry.transactionDate,
        utrBasedMatch: utrMatch
          ? { confidence: 100, invoiceNumber: utrMatch.invoice.invoiceNumber }
          : null,
        amountDateSuggestions: suggestions.map((inv) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customer.name,
          grandTotal: Number(inv.grandTotal),
          amountDue: Number(inv.amountDue),
          confidence: 80,
        })),
      };
    }
  }