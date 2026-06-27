import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { AuditTrailService } from '../../../shared/audit/audit-trail.service';
import { GSTCalculationEngine } from '../invoices/gst-calculation.engine';
import { AuditSeverity, ExpenseStatus, PayoutStatus } from '../../../common/enums';
import { CACHE_KEYS, CACHE_TTL } from '../../../common/constants';
import {
  AuditQueryDto,
  GstReportDto,
  HsnQueryDto,
  PnlQueryDto,
  TdsQueryDto,
} from './dto/report.dto';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditTrailService,
    private readonly gstEngine: GSTCalculationEngine,
  ) {}

  private num(value: unknown): number {
    return value === null || value === undefined ? 0 : Number(value);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /** Returns [start, end) Date bounds for an Indian financial year string like "2025-2026". */
  private fyBounds(financialYear?: string): { start: Date; end: Date; label: string } {
    let startYear: number;
    if (financialYear && /^\d{4}-\d{4}$/.test(financialYear)) {
      startYear = parseInt(financialYear.split('-')[0], 10);
    } else {
      const now = new Date();
      startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    }
    return {
      start: new Date(startYear, 3, 1),
      end: new Date(startYear + 1, 3, 1),
      label: `${startYear}-${startYear + 1}`,
    };
  }

  async getGstSummary(dto: GstReportDto) {
    const { start, end, label } = this.fyBounds(dto.financialYear);
    const cacheKey = `${CACHE_KEYS.GST_REPORT}${label}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const filings = await this.prisma.gSTFiling.findMany({
      where: { dueDate: { gte: start, lt: end } },
      orderBy: { period: 'asc' },
    });

    const result = filings.map((f) => ({
      id: f.id,
      period: f.period,
      returnType: f.returnType,
      gstOutput: this.num(f.gstOutput),
      gstInput: this.num(f.gstInput),
      itcAvailable: this.num(f.itcAvailable),
      itcUtilized: this.num(f.itcUtilized),
      netPayable: this.num(f.netPayable),
      filingStatus: f.filingStatus,
      filedDate: f.filedDate,
      dueDate: f.dueDate,
    }));

    await this.redis.setJson(cacheKey, result, CACHE_TTL.GST_REPORT);
    return result;
  }

  async getGstComplianceScore() {
    const filings = await this.prisma.gSTFiling.findMany();
    const totalFilings = filings.length;
    const onTimeFilings = filings.filter(
      (f) =>
        f.filingStatus === 'filed' &&
        f.filedDate &&
        f.filedDate.getTime() <= f.dueDate.getTime(),
    ).length;

    const totalItcAvailable = filings.reduce(
      (s, f) => s + this.num(f.itcAvailable),
      0,
    );
    const totalItcUtilized = filings.reduce(
      (s, f) => s + this.num(f.itcUtilized),
      0,
    );
    const itcMatchRate =
      totalItcAvailable > 0
        ? Math.min(100, (totalItcUtilized / totalItcAvailable) * 100)
        : 100;

    const filed = filings.filter((f) => f.filingStatus !== 'pending').length;
    const filingAccuracy = totalFilings > 0 ? (filed / totalFilings) * 100 : 100;

    return this.gstEngine.computeComplianceScore({
      totalFilings,
      onTimeFilings,
      itcMatchRate,
      filingAccuracy,
    });
  }

  async getHsnBreakdown(query: HsnQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const where = query.period
      ? {
          invoice: {
            status: { in: ['sent', 'partial', 'paid', 'overdue'] },
            issueDate: this.periodBounds(query.period),
          },
        }
      : { invoice: { status: { in: ['sent', 'partial', 'paid', 'overdue'] } } };

    const lineItems = await this.prisma.invoiceLineItem.findMany({
      where,
      select: {
        hsnCode: true,
        description: true,
        gstRate: true,
        quantity: true,
        taxableAmt: true,
        gstAmount: true,
        total: true,
      },
    });

    const map = new Map<
      string,
      {
        hsnCode: string;
        description: string;
        quantity: number;
        taxableValue: number;
        gstRate: number;
        gstAmount: number;
        total: number;
      }
    >();

    for (const li of lineItems) {
      const hsn = li.hsnCode || 'UNCLASSIFIED';
      const key = `${hsn}:${li.gstRate}`;
      const existing = map.get(key) ?? {
        hsnCode: hsn,
        description: li.description,
        quantity: 0,
        taxableValue: 0,
        gstRate: li.gstRate,
        gstAmount: 0,
        total: 0,
      };
      existing.quantity += this.num(li.quantity);
      existing.taxableValue += this.num(li.taxableAmt);
      existing.gstAmount += this.num(li.gstAmount);
      existing.total += this.num(li.total);
      map.set(key, existing);
    }

    const rows = Array.from(map.values())
      .map((r) => ({
        ...r,
        quantity: this.round(r.quantity),
        taxableValue: this.round(r.taxableValue),
        gstAmount: this.round(r.gstAmount),
        total: this.round(r.total),
      }))
      .sort((a, b) => b.total - a.total);

    const start = (page - 1) * limit;
    return {
      data: rows.slice(start, start + limit),
      total: rows.length,
      page,
      limit,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async getTds(query: TdsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = query.period ? { period: query.period } : {};

    const [entries, total] = await this.prisma.$transaction([
      this.prisma.tdsEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tdsEntry.count({ where }),
    ]);

    return {
      data: entries.map((t) => ({
        section: t.section,
        payeeName: t.payeeName,
        pan: t.pan,
        grossAmount: this.num(t.grossAmount),
        tdsRate: this.num(t.tdsRate),
        tdsAmount: this.num(t.tdsAmount),
        period: t.period,
        depositedDate: t.depositedDate,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPnl(query: PnlQueryDto) {
    const cacheKey = `${CACHE_KEYS.PNL_REPORT}${query.financialYear || 'current'}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached && !query.from && !query.to) return cached;

    const { start, end } = query.from && query.to
      ? { start: new Date(query.from), end: new Date(query.to) }
      : this.fyBounds(query.financialYear);

    const revenueAgg = await this.prisma.invoice.aggregate({
      _sum: { subtotal: true, totalGst: true, grandTotal: true },
      where: {
        status: { in: ['paid', 'partial', 'sent', 'overdue'] },
        issueDate: { gte: start, lt: end },
      },
    });

    const expenseAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.REIMBURSED] },
        submittedDate: { gte: start, lt: end },
      },
    });

    const payoutAgg = await this.prisma.payout.aggregate({
      _sum: { amount: true },
      where: {
        status: PayoutStatus.DISBURSED,
        disbursedAt: { gte: start, lt: end },
      },
    });

    const revenue = this.num(revenueAgg._sum.subtotal);
    const expenses =
      this.num(expenseAgg._sum.amount) + this.num(payoutAgg._sum.amount);
    const grossProfit = revenue - this.num(payoutAgg._sum.amount);
    const netProfit = revenue - expenses;

    const result = {
      revenue: this.round(revenue),
      expenses: this.round(expenses),
      grossProfit: this.round(grossProfit),
      netProfit: this.round(netProfit),
      margin: revenue > 0 ? this.round((netProfit / revenue) * 100) : 0,
    };

    if (!query.from && !query.to) {
      await this.redis.setJson(cacheKey, result, CACHE_TTL.PNL_REPORT);
    }
    return result;
  }

  async getMonthlyPnl(query: PnlQueryDto) {
    const { start, end } = this.fyBounds(query.financialYear);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['paid', 'partial', 'sent', 'overdue'] },
        issueDate: { gte: start, lt: end },
      },
      select: { issueDate: true, subtotal: true },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.REIMBURSED] },
        submittedDate: { gte: start, lt: end },
      },
      select: { submittedDate: true, amount: true },
    });

    const months: Record<string, { revenue: number; expenses: number }> = {};
    const labelFor = (d: Date) =>
      d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      months[labelFor(d)] = { revenue: 0, expenses: 0 };
    }

    for (const inv of invoices) {
      const key = labelFor(inv.issueDate);
      if (months[key]) months[key].revenue += this.num(inv.subtotal);
    }
    for (const exp of expenses) {
      const key = labelFor(exp.submittedDate);
      if (months[key]) months[key].expenses += this.num(exp.amount);
    }

    return Object.entries(months).map(([month, v]) => ({
      month,
      revenue: this.round(v.revenue),
      expenses: this.round(v.expenses),
      grossProfit: this.round(v.revenue - v.expenses),
      netProfit: this.round(v.revenue - v.expenses),
    }));
  }

  async getAudit(query: AuditQueryDto) {
    const result = await this.audit.getAuditTrail({
      action: query.action,
      severity: query.severity as AuditSeverity | undefined,
      entity: query.entity,
      fromDate: query.from ? new Date(query.from) : undefined,
      toDate: query.to ? new Date(query.to) : undefined,
      page: query.page || 1,
      limit: query.limit || 20,
    });

    return {
      data: result.records.map((r) => ({
        id: r.id,
        timestamp: r.createdAt,
        user: r.userId || 'system',
        action: r.action,
        entity: r.entity,
        entityId: r.entityId,
        description: r.description,
        severity: r.severity,
        ipAddress: r.ipAddress || undefined,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private periodBounds(period: string): { gte: Date; lt: Date } {
    const [year, month] = period.split('-').map((n) => parseInt(n, 10));
    return {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }
}
