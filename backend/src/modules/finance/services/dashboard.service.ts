import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invoice } from '../entities/invoice.entity'
import { Payment } from '../entities/payment.entity'
import { Expense } from '../entities/expense.entity'
import { Payout } from '../entities/payout-schedule.entity'

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
      const [invoices, payments, payouts] = await Promise.all([
        this.invoiceRepo.find(),
        this.paymentRepo.find(),
        this.payoutRepo.find({ where: { status: 'scheduled' } }),
      ])
      const totalRevenue = invoices.reduce((s, i) => s + Number(i.total), 0)
      const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
      const receivables = totalRevenue - totalPaid
      const payables = payouts.reduce((s, p) => s + Number(p.amount), 0)
      return {
        totalRevenue,
        receivables,
        payables,
        eventMargin: totalRevenue > 0 ? Math.round(((totalRevenue - payables) / totalRevenue) * 100) : 0,
        taxLiability: Math.round(totalRevenue * 0.18),
        cashForecast: totalPaid - payables,
      }
    } catch {
      return { totalRevenue: 0, receivables: 0, payables: 0, eventMargin: 0, taxLiability: 0, cashForecast: 0 }
    }
  }

  async getRevenueTrends(year: number) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    try {
      const invoices = await this.invoiceRepo.find()
      const byMonth: Record<number, number> = {}
      for (const inv of invoices) {
        const d = new Date(inv.createdAt)
        if (d.getFullYear() === year) {
          const m = d.getMonth()
          byMonth[m] = (byMonth[m] ?? 0) + Number(inv.total)
        }
      }
      return months.map((month, i) => ({
        month, revenue: byMonth[i] ?? 0, expenses: 0, profit: byMonth[i] ?? 0,
      }))
    } catch {
      return months.map((month) => ({ month, revenue: 0, expenses: 0, profit: 0 }))
    }
  }

  async getBranchPerformance() {
    return [
      { branchId: '1', branchName: 'Mumbai HQ', revenue: 0, expenses: 0, margin: 0, events: 0 },
      { branchId: '2', branchName: 'Delhi Office', revenue: 0, expenses: 0, margin: 0, events: 0 },
    ]
  }

  async getCashHealth() {
    try {
      const payments = await this.paymentRepo.find()
      const total = payments.reduce((s, p) => s + Number(p.amount), 0)
      return {
        netLiquidity: total,
        opexRunway: 6,
        healthScore: total > 0 ? 75 : 0,
        weeklyForecast: Array.from({ length: 6 }, (_, i) => ({
          week: `W${i + 1}`, historical: 0, projected: 0,
        })),
      }
    } catch {
      return {
        netLiquidity: 0, opexRunway: 0, healthScore: 0,
        weeklyForecast: Array.from({ length: 6 }, (_, i) => ({ week: `W${i + 1}`, historical: 0, projected: 0 })),
      }
    }
  }
}
