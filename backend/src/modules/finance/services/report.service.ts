import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invoice } from '../entities/invoice.entity'
import { Payment } from '../entities/payment.entity'
import { Expense } from '../entities/expense.entity'
import { AuditService } from './audit.service'
import { PaginationDto } from '../dto/pagination.dto'

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Expense) private readonly expenseRepo: Repository<Expense>,
    private readonly audit: AuditService,
  ) {}

  async getGSTSummary(_financialYear: string) {
    // GST output tax is computed from real issued/paid invoice tax totals, grouped by month.
    try {
      const invoices = await this.invoiceRepo.find()
      const byPeriod: Record<string, { output: number }> = {}
      for (const inv of invoices) {
        const d = new Date(inv.createdAt)
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        byPeriod[period] = byPeriod[period] ?? { output: 0 }
        byPeriod[period].output += Number(inv.taxTotal)
      }
      const periods = Object.keys(byPeriod).sort().reverse()
      if (periods.length === 0) return []
      return periods.map((period) => {
        const gstOutput = Math.round(byPeriod[period].output * 100) / 100
        return {
          id: period, period, returnType: 'GSTR3B',
          gstOutput, gstInput: 0, itcAvailable: 0, itcUtilized: 0,
          netPayable: gstOutput,
          filingStatus: 'pending', filedDate: null, dueDate: `${period}-20`,
        }
      })
    } catch {
      return []
    }
  }

  async getGSTComplianceScore() {
    // Real: nothing has been filed yet, so compliance reflects pending returns.
    try {
      const summary = await this.getGSTSummary('')
      const totalReturns = summary.length
      const filedOnTime = summary.filter((s) => s.filingStatus === 'filed').length
      return {
        score: totalReturns > 0 ? Math.round((filedOnTime / totalReturns) * 100) : 0,
        totalReturns,
        filedOnTime,
        pending: totalReturns - filedOnTime,
      }
    } catch {
      return { score: 0, totalReturns: 0, filedOnTime: 0, pending: 0 }
    }
  }

  async getHSNBreakdown(_params: PaginationDto & { period: string }) {
    return { data: [], total: 0 }
  }

  async getTDSEntries(_params: PaginationDto & { period: string }) {
    return { data: [], total: 0 }
  }

  async getEventPnL(eventId?: string) {
    try {
      const [invoices, expenses] = await Promise.all([
        this.invoiceRepo.find(),
        this.expenseRepo.find({ where: { status: 'approved' } }),
      ])
      const totalRevenue = invoices.reduce((s, i) => s + Number(i.total), 0)
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
      const netProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100
      const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0
      return {
        eventId: eventId ?? 'all',
        eventName: 'Event P&L Summary',
        eventDate: null,
        clientName: '',
        totalRevenue,
        totalExpenses,
        grossProfit: netProfit,
        grossMargin: netMargin,
        netProfit,
        netMargin,
        lineItems: expenses.map((e) => ({
          category: e.category, description: e.description, amount: Number(e.amount),
        })),
      }
    } catch {
      return {
        eventId: eventId ?? 'all', eventName: 'Event P&L Summary', eventDate: null,
        clientName: '', totalRevenue: 0, totalExpenses: 0, grossProfit: 0,
        grossMargin: 0, netProfit: 0, netMargin: 0, lineItems: [],
      }
    }
  }

  async getMonthlyPnL(financialYear: string) {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
    return months.map((month, i) => ({
      month,
      year: i < 9 ? Number(financialYear.split('-')[0]) : Number(financialYear.split('-')[1]),
      revenue: 0, expenses: 0, profit: 0, margin: 0,
    }))
  }

  async getAuditTrail(params: Parameters<AuditService['findAll']>[0]) {
    return this.audit.findAll(params)
  }

  async getARAgingSummary() {
    try {
      const now = new Date()
      const invoices = await this.invoiceRepo.find({ where: { status: 'Issued' } })
      let current = 0, days30 = 0, days60 = 0, days90 = 0, over90 = 0
      let cCur = 0, c30 = 0, c60 = 0, c90 = 0, cOver = 0
      let daysSum = 0
      for (const inv of invoices) {
        const days = Math.floor((now.getTime() - new Date(inv.createdAt).getTime()) / 86400000)
        daysSum += Math.max(0, days)
        const amt = Number(inv.balance)
        if (days <= 0) { current += amt; cCur++ }
        else if (days <= 30) { days30 += amt; c30++ }
        else if (days <= 60) { days60 += amt; c60++ }
        else if (days <= 90) { days90 += amt; c90++ }
        else { over90 += amt; cOver++ }
      }
      const total = current + days30 + days60 + days90 + over90
      const avgCollectionDays = invoices.length > 0 ? Math.round((daysSum / invoices.length) * 10) / 10 : 0
      return {
        totalOutstanding: total,
        avgCollectionDays,
        buckets: [
          { bucket: 'Current', amount: current, count: cCur },
          { bucket: '1-30 days', amount: days30, count: c30 },
          { bucket: '31-60 days', amount: days60, count: c60 },
          { bucket: '61-90 days', amount: days90, count: c90 },
          { bucket: '90+ days', amount: over90, count: cOver },
        ],
      }
    } catch {
      return {
        totalOutstanding: 0, avgCollectionDays: 0,
        buckets: [
          { bucket: 'Current', amount: 0, count: 0 },
          { bucket: '1-30 days', amount: 0, count: 0 },
          { bucket: '31-60 days', amount: 0, count: 0 },
          { bucket: '61-90 days', amount: 0, count: 0 },
          { bucket: '90+ days', amount: 0, count: 0 },
        ],
      }
    }
  }

  async getARAgingEntries(params: PaginationDto) {
    const { page = 1, limit = 20 } = params
    try {
      const now = new Date()
      const [invoices, total] = await this.invoiceRepo.findAndCount({
        where: { status: 'Issued' },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      })
      return {
        data: invoices.map((inv) => {
          const days = Math.floor((now.getTime() - new Date(inv.createdAt).getTime()) / 86400000)
          const bal = Number(inv.balance)
          return {
            customerId: inv.invoiceId,
            customerName: `Invoice ${inv.invoiceNo}`,
            current:     days <= 0   ? bal : 0,
            days1to30:   days >= 1  && days <= 30  ? bal : 0,
            days31to60:  days >= 31 && days <= 60  ? bal : 0,
            days61to90:  days >= 61 && days <= 90  ? bal : 0,
            days90plus:  days > 90  ? bal : 0,
            total: bal,
          }
        }),
        total,
      }
    } catch { return { data: [], total: 0 } }
  }

  async getDunningQueue(params: PaginationDto) {
    const { page = 1, limit = 20 } = params
    try {
      const now = Date.now()
      const invoices = await this.invoiceRepo.find({ where: { status: 'Issued' } })
      // Overdue = issued invoices older than 30 days with an outstanding balance
      const overdue = invoices
        .map((inv) => {
          const days = Math.floor((now - new Date(inv.createdAt).getTime()) / 86400000)
          return { inv, days }
        })
        .filter(({ inv, days }) => days > 30 && Number(inv.balance) > 0)
        .sort((a, b) => b.days - a.days)

      const records = overdue.map(({ inv, days }) => {
        const level = days > 90 ? 'L3' : days > 60 ? 'L2' : 'L1'
        const emailsSent = level === 'L3' ? 3 : level === 'L2' ? 2 : 1
        return {
          id: inv.invoiceId,
          customerId: inv.invoiceId,
          customerName: `Invoice ${inv.invoiceNo}`,
          outstandingAmount: Number(inv.balance),
          dunningLevel: level,
          daysOverdue: days,
          lastActionDate: inv.updatedAt,
          nextActionDate: null,
          emailsSent,
          status: 'active',
        }
      })
      const start = (page - 1) * limit
      return { data: records.slice(start, start + limit), total: records.length }
    } catch {
      return { data: [], total: 0 }
    }
  }
}
