import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { CACHE_KEYS, CACHE_TTL } from '../../../common/constants';

export interface DashboardKPIs {
  totalRevenue: number;
  receivables: number;
  payables: number;
  eventMargin: number;
  taxLiability: number;
  cashForecast: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  growthPercent: number;
}

export interface CashHealth {
  netLiquidity: number;
  opexRunway: number;
  healthScore: number;
  weeklyForecast: Array<{
    week: string;
    historical: number;
    projected: number;
  }>;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

@Injectable()
export class DashboardService {
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

  async getKPIs(): Promise<DashboardKPIs> {
    const cacheKey = `${CACHE_KEYS.DASHBOARD}kpis`;
    const cached = await this.redis.getJson<DashboardKPIs>(cacheKey);
    if (cached) return cached;

    const [revenueAgg, receivablesAgg, payablesAgg, outputGst, inputGst, expenseAgg] =
      await Promise.all([
        this.prisma.invoice.aggregate({ _sum: { amountPaid: true } }),
        this.prisma.invoice.aggregate({
          _sum: { amountDue: true },
          where: { status: { in: ['sent', 'partial', 'overdue'] } },
        }),
        this.prisma.vendorBill.aggregate({
          _sum: { totalAmount: true },
          where: { status: { in: ['pending', 'approved', 'overdue'] } },
        }),
        this.prisma.invoice.aggregate({
          _sum: { totalGst: true },
          where: { status: { in: ['sent', 'partial', 'paid', 'overdue'] } },
        }),
        this.prisma.vendorBill.aggregate({
          _sum: { gstAmount: true },
          where: { status: { in: ['approved', 'paid'] } },
        }),
        this.prisma.expense.aggregate({
          _sum: { amount: true },
          where: { status: { in: ['approved', 'reimbursed'] } },
        }),
      ]);

    const totalRevenue = this.num(revenueAgg._sum.amountPaid);
    const receivables = this.num(receivablesAgg._sum.amountDue);
    const payables = this.num(payablesAgg._sum.totalAmount);
    const expenses =
      this.num(expenseAgg._sum.amount) + this.num(payablesAgg._sum.totalAmount);
    const taxLiability = this.round(
      this.num(outputGst._sum.totalGst) - this.num(inputGst._sum.gstAmount),
    );
    const eventMargin =
      totalRevenue > 0
        ? this.round(((totalRevenue - expenses) / totalRevenue) * 100)
        : 0;
    const cashForecast = this.round(receivables - payables);

    const result: DashboardKPIs = {
      totalRevenue: this.round(totalRevenue),
      receivables: this.round(receivables),
      payables: this.round(payables),
      eventMargin,
      taxLiability,
      cashForecast,
    };

    await this.redis.setJson(cacheKey, result, CACHE_TTL.DASHBOARD);
    return result;
  }

  async getRevenueTrends(year: number): Promise<MonthlyTrend[]> {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const [invoices, expenses, bills] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { issueDate: { gte: start, lt: end } },
        select: { issueDate: true, grandTotal: true },
      }),
      this.prisma.expense.findMany({
        where: {
          submittedDate: { gte: start, lt: end },
          status: { in: ['approved', 'reimbursed'] },
        },
        select: { submittedDate: true, amount: true },
      }),
      this.prisma.vendorBill.findMany({
        where: { billDate: { gte: start, lt: end } },
        select: { billDate: true, totalAmount: true },
      }),
    ]);

    const revenueByMonth = new Array(12).fill(0);
    const expenseByMonth = new Array(12).fill(0);

    for (const inv of invoices) {
      revenueByMonth[inv.issueDate.getMonth()] += this.num(inv.grandTotal);
    }
    for (const exp of expenses) {
      expenseByMonth[exp.submittedDate.getMonth()] += this.num(exp.amount);
    }
    for (const bill of bills) {
      expenseByMonth[bill.billDate.getMonth()] += this.num(bill.totalAmount);
    }

    return MONTHS.map((month, idx) => {
      const revenue = this.round(revenueByMonth[idx]);
      const monthExpenses = this.round(expenseByMonth[idx]);
      const grossProfit = this.round(revenue - monthExpenses);
      return {
        month: `${month} ${year}`,
        revenue,
        expenses: monthExpenses,
        grossProfit,
        netProfit: grossProfit,
      };
    });
  }

  /**
   * The FIN module does not own the branch dimension (it lives in the central
   * Org module). We return a single consolidated entry computed from finance
   * totals, with growth measured against the previous calendar year.
   */
  async getBranchPerformance(): Promise<BranchPerformance[]> {
    const now = new Date();
    const thisYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);

    const [thisYearRev, lastYearRev, expenseAgg, billAgg] = await Promise.all([
      this.prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: { issueDate: { gte: thisYearStart } },
      }),
      this.prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: { issueDate: { gte: lastYearStart, lt: thisYearStart } },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['approved', 'reimbursed'] } },
      }),
      this.prisma.vendorBill.aggregate({ _sum: { totalAmount: true } }),
    ]);

    const revenue = this.num(thisYearRev._sum.grandTotal);
    const prevRevenue = this.num(lastYearRev._sum.grandTotal);
    const expenses =
      this.num(expenseAgg._sum.amount) + this.num(billAgg._sum.totalAmount);
    const profit = this.round(revenue - expenses);
    const margin = revenue > 0 ? this.round((profit / revenue) * 100) : 0;
    const growthPercent =
      prevRevenue > 0
        ? this.round(((revenue - prevRevenue) / prevRevenue) * 100)
        : 0;

    return [
      {
        branchId: 'all',
        branchName: 'All Branches',
        revenue: this.round(revenue),
        expenses: this.round(expenses),
        profit,
        margin,
        growthPercent,
      },
    ];
  }

  async getCashHealth(): Promise<CashHealth> {
    const cacheKey = `${CACHE_KEYS.DASHBOARD}cash-health`;
    const cached = await this.redis.getJson<CashHealth>(cacheKey);
    if (cached) return cached;

    const [inflowAgg, outflowBills, outflowExpenses] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'settled' },
      }),
      this.prisma.vendorBill.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'paid' },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: 'reimbursed' },
      }),
    ]);

    const inflow = this.num(inflowAgg._sum.amount);
    const outflow =
      this.num(outflowBills._sum.totalAmount) +
      this.num(outflowExpenses._sum.amount);
    const netLiquidity = this.round(inflow - outflow);

    // Approximate monthly OPEX from total recognised expenses over ~12 months.
    const monthlyOpex = outflow > 0 ? outflow / 12 : 0;
    const opexRunway =
      monthlyOpex > 0 ? this.round(netLiquidity / monthlyOpex) : 0;

    let healthScore = 50;
    if (netLiquidity > 0) healthScore += 25;
    if (opexRunway >= 6) healthScore += 25;
    else if (opexRunway >= 3) healthScore += 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const weeklyInflow = inflow / 52;
    const weeklyOutflow = outflow / 52;
    const weeklyForecast = Array.from({ length: 6 }, (_, i) => {
      const week = `W${i + 1}`;
      const historical = this.round(weeklyInflow - weeklyOutflow);
      const projected = this.round((weeklyInflow - weeklyOutflow) * (1 + i * 0.02));
      return { week, historical, projected };
    });

    const result: CashHealth = {
      netLiquidity,
      opexRunway,
      healthScore,
      weeklyForecast,
    };

    await this.redis.setJson(cacheKey, result, CACHE_TTL.DASHBOARD);
    return result;
  }
}
