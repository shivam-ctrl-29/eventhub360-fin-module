import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invoice } from '../entities/invoice.entity'
import { Payment } from '../entities/payment.entity'
import { Expense } from '../entities/expense.entity'
import { Payout } from '../entities/payout-schedule.entity'

const CATEGORY_LABELS: Record<string, string> = {
  food_beverage: 'Food & Beverage',
  logistics: 'Logistics',
  travel: 'Travel',
  marketing: 'Marketing',
  venue: 'Venue',
  decor: 'Decor',
  miscellaneous: 'Miscellaneous',
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Expense) private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Payout) private readonly payoutRepo: Repository<Payout>,
  ) {}

  async getKPIs() {
    try {
      const [invoices, payments, payouts, expenses] = await Promise.all([
        this.invoiceRepo.find(),
        this.paymentRepo.find(),
        this.payoutRepo.find({ where: { status: 'scheduled' } }),
        this.expenseRepo.find({ where: { status: 'approved' } }),
      ])
      const totalRevenue = invoices.reduce((s, i) => s + Number(i.total), 0)
      const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
      const receivables = totalRevenue - totalPaid
      const payables = payouts.reduce((s, p) => s + Number(p.amount), 0)
      return {
        totalRevenue,
        receivables,
        payables,
        eventMargin: totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0,
        taxLiability: invoices.reduce((s, i) => s + Number(i.taxTotal), 0),
        cashForecast: totalPaid - payables,
      }
    } catch {
      return { totalRevenue: 0, receivables: 0, payables: 0, eventMargin: 0, taxLiability: 0, cashForecast: 0 }
    }
  }

  async getRevenueTrends(year: number) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    try {
      const [invoices, expenses] = await Promise.all([this.invoiceRepo.find(), this.expenseRepo.find()])
      const rev: Record<number, number> = {}
      const exp: Record<number, number> = {}
      for (const inv of invoices) {
        const d = new Date(inv.createdAt)
        if (d.getFullYear() === year) rev[d.getMonth()] = (rev[d.getMonth()] ?? 0) + Number(inv.total)
      }
      for (const e of expenses) {
        const d = new Date(e.createdAt)
        if (d.getFullYear() === year) exp[d.getMonth()] = (exp[d.getMonth()] ?? 0) + Number(e.amount)
      }
      return months.map((month, i) => ({
        month, revenue: rev[i] ?? 0, expenses: exp[i] ?? 0, profit: (rev[i] ?? 0) - (exp[i] ?? 0),
      }))
    } catch {
      return months.map((month) => ({ month, revenue: 0, expenses: 0, profit: 0 }))
    }
  }

  async getCompany() {
    try {
      const rows = await this.invoiceRepo.manager.query(
        `SELECT company_id AS "companyId", name, gstin, pan, base_currency AS "baseCurrency"
         FROM company ORDER BY company_id LIMIT 1`,
      )
      return rows[0] ?? null
    } catch {
      return null
    }
  }

  async getExpenseDistribution() {
    try {
      const rows = await this.expenseRepo
        .createQueryBuilder('e')
        .select('e.category', 'category')
        .addSelect('SUM(e.amount)', 'amount')
        .groupBy('e.category')
        .orderBy('amount', 'DESC')
        .getRawMany()
      const total = rows.reduce((s, r) => s + Number(r.amount), 0)
      return rows.map((r) => ({
        category: CATEGORY_LABELS[r.category] ?? r.category,
        amount: Number(r.amount),
        pct: total > 0 ? Math.round((Number(r.amount) / total) * 100) : 0,
      }))
    } catch {
      return []
    }
  }

  async getBranchPerformance() {
    try {
      const rows = await this.invoiceRepo.manager.query(`
        SELECT b.branch_id   AS "branchId",
               b.name        AS "branchName",
               COALESCE(SUM(i.total), 0)   AS revenue,
               COUNT(i.invoice_id)         AS events
        FROM branch b
        LEFT JOIN invoice i ON i.branch_id = b.branch_id AND i.is_active = true
        GROUP BY b.branch_id, b.name
        ORDER BY revenue DESC
      `)
      const totalRev = rows.reduce((s: number, r: any) => s + Number(r.revenue), 0)
      return rows.map((r: any) => ({
        branchId: String(r.branchId),
        branchName: r.branchName,
        revenue: Number(r.revenue),
        events: Number(r.events),
        sharePct: totalRev > 0 ? Math.round((Number(r.revenue) / totalRev) * 100) : 0,
      }))
    } catch {
      return []
    }
  }

  async getCashHealth() {
    try {
      const [payments, expenses, payouts] = await Promise.all([
        this.paymentRepo.find(),
        this.expenseRepo.find({ where: { status: 'approved' } }),
        this.payoutRepo.find(),
      ])
      const inflow = payments.reduce((s, p) => s + Number(p.amount), 0)
      const outflow = expenses.reduce((s, e) => s + Number(e.amount), 0) +
        payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
      const netLiquidity = inflow - outflow
      // monthly burn = approved expenses spread over distinct expense months
      const months = new Set(expenses.map((e) => new Date(e.createdAt).toISOString().slice(0, 7)))
      const monthlyBurn = months.size > 0 ? outflow / months.size : 0
      const opexRunway = monthlyBurn > 0 ? netLiquidity / monthlyBurn : 0
      const healthScore = netLiquidity <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((inflow / (outflow || 1)) * 50)))

      // real weekly forecast: distribute recent payments across 6 weeks
      const now = Date.now()
      const weeklyForecast = Array.from({ length: 6 }, (_, i) => {
        const start = now - (6 - i) * 7 * 86400000
        const end = start + 7 * 86400000
        const historical = payments
          .filter((p) => { const t = new Date(p.paidAt).getTime(); return t >= start && t < end })
          .reduce((s, p) => s + Number(p.amount), 0)
        return { week: `W${i + 1}`, historical, projected: Math.round(monthlyBurn / 4) }
      })

      const lastPayment = payments.reduce<Date | null>((m, p) => {
        const t = new Date(p.paidAt)
        return !m || t > m ? t : m
      }, null)

      return {
        netLiquidity,
        opexRunway: Math.round(opexRunway * 10) / 10,
        healthScore,
        inflows: inflow,
        outflows: outflow,
        lastPaymentAt: lastPayment ? lastPayment.toISOString() : null,
        weeklyForecast,
      }
    } catch {
      return {
        netLiquidity: 0, opexRunway: 0, healthScore: 0,
        inflows: 0, outflows: 0, lastPaymentAt: null,
        weeklyForecast: Array.from({ length: 6 }, (_, i) => ({ week: `W${i + 1}`, historical: 0, projected: 0 })),
      }
    }
  }
}
