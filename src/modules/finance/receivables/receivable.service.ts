import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { CACHE_KEYS, CACHE_TTL } from '../../../common/constants';
import { DunningLevel } from '../../../common/enums';
import { AgingFilterDto } from './dto/receivable.dto';

interface AgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

@Injectable()
export class ReceivableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private num(value: unknown): number {
    return value === null || value === undefined ? 0 : Number(value);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private daysOverdue(dueDate: Date, now: Date): number {
    return Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000);
  }

  private bucketFor(days: number): keyof Omit<AgingBuckets, 'total'> {
    if (days <= 0) return 'current';
    if (days <= 30) return 'days1to30';
    if (days <= 60) return 'days31to60';
    if (days <= 90) return 'days61to90';
    return 'days90plus';
  }

  private dunningLevelFor(days: number): DunningLevel | undefined {
    if (days < 1) return undefined;
    if (days <= 7) return DunningLevel.L1;
    if (days <= 21) return DunningLevel.L2;
    if (days <= 42) return DunningLevel.L3;
    return DunningLevel.L4;
  }

  async getAgingSummary() {
    const cacheKey = `${CACHE_KEYS.AR_AGING}summary`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['sent', 'partial', 'overdue'] },
        amountDue: { gt: 0 },
      },
      select: { dueDate: true, amountDue: true },
    });

    const buckets: AgingBuckets = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0,
      total: 0,
    };

    for (const inv of invoices) {
      const amt = this.num(inv.amountDue);
      const bucket = this.bucketFor(this.daysOverdue(inv.dueDate, now));
      buckets[bucket] += amt;
      buckets.total += amt;
    }

    Object.keys(buckets).forEach((k) => {
      buckets[k as keyof AgingBuckets] = this.round(
        buckets[k as keyof AgingBuckets],
      );
    });

    const avgCollectionDays = await this.computeAvgCollectionDays();

    const result = {
      totalOutstanding: buckets.total,
      avgCollectionDays,
      bucketTotals: {
        current: buckets.current,
        days1to30: buckets.days1to30,
        days31to60: buckets.days31to60,
        days61to90: buckets.days61to90,
        days90plus: buckets.days90plus,
      },
      invoiceCount: invoices.length,
    };

    await this.redis.setJson(cacheKey, result, CACHE_TTL.AR_AGING);
    return result;
  }

  private async computeAvgCollectionDays(): Promise<number> {
    const payments = await this.prisma.payment.findMany({
      where: { status: 'settled' },
      select: { paymentDate: true, invoice: { select: { issueDate: true } } },
      take: 500,
      orderBy: { createdAt: 'desc' },
    });

    if (payments.length === 0) return 0;

    const totalDays = payments.reduce((sum, p) => {
      const days = Math.max(
        0,
        Math.floor(
          (p.paymentDate.getTime() - p.invoice.issueDate.getTime()) /
            86_400_000,
        ),
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / payments.length);
  }

  async getAging(filter: AgingFilterDto) {
    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['sent', 'partial', 'overdue'] },
        amountDue: { gt: 0 },
        ...(filter.search
          ? { customer: { name: { contains: filter.search, mode: 'insensitive' } } }
          : {}),
      },
      select: {
        dueDate: true,
        amountDue: true,
        customerId: true,
        customer: { select: { name: true } },
      },
    });

    const byCustomer = new Map<
      string,
      AgingBuckets & {
        customerId: string;
        customerName: string;
        maxDaysOverdue: number;
      }
    >();

    for (const inv of invoices) {
      const amt = this.num(inv.amountDue);
      const days = this.daysOverdue(inv.dueDate, now);
      const bucket = this.bucketFor(days);

      const existing =
        byCustomer.get(inv.customerId) ??
        ({
          customerId: inv.customerId,
          customerName: inv.customer.name,
          current: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          days90plus: 0,
          total: 0,
          maxDaysOverdue: 0,
        } as AgingBuckets & {
          customerId: string;
          customerName: string;
          maxDaysOverdue: number;
        });

      existing[bucket] += amt;
      existing.total += amt;
      existing.maxDaysOverdue = Math.max(existing.maxDaysOverdue, days);
      byCustomer.set(inv.customerId, existing);
    }

    const entries = Array.from(byCustomer.values()).map((c) => ({
      customerId: c.customerId,
      customerName: c.customerName,
      current: this.round(c.current),
      days1to30: this.round(c.days1to30),
      days31to60: this.round(c.days31to60),
      days61to90: this.round(c.days61to90),
      days90plus: this.round(c.days90plus),
      total: this.round(c.total),
      dunningLevel: this.dunningLevelFor(c.maxDaysOverdue),
    }));

    entries.sort((a, b) => b.total - a.total);

    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const start = (page - 1) * limit;

    return {
      data: entries.slice(start, start + limit),
      total: entries.length,
      page,
      limit,
      totalPages: Math.ceil(entries.length / limit),
    };
  }
}
