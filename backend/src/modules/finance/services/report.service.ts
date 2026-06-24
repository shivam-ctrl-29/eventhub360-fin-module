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
    // GST filing records will come from a dedicated gst_filing table (future integration)
    return this.mockGSTSummary()
  }

  async getGSTComplianceScore() {
    return { score: 0, totalReturns: 0, filedOnTime: 0, pending: 0 }
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
      for (const inv of invoices) {
        const days = Math.floor((now.getTime() - new Date(inv.updatedAt).getTime()) / 86400000)
        const amt = Number(inv.balance)
        if (days <= 0) current += amt
        else if (days <= 30) days30 += amt
        else if (days <= 60) days60 += amt
        else if (days <= 90) days90 += amt
        else over90 += amt
      }
      const total = current + days30 + days60 + days90 + over90
      return {
        totalOutstanding: total,
        avgCollectionDays: 45,
        buckets: [
          { bucket: 'Current', amount: current, count: 0 },
          { bucket: '1-30 days', amount: days30, count: 0 },
          { bucket: '31-60 days', amount: days60, count: 0 },
          { bucket: '61-90 days', amount: days90, count: 0 },
          { bucket: '90+ days', amount: over90, count: 0 },
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
          const days = Math.floor((now.getTime() - new Date(inv.updatedAt).getTime()) / 86400000)
          const bucket = days <= 0 ? 'Current' : days <= 30 ? '1-30 days' : days <= 60 ? '31-60 days' : days <= 90 ? '61-90 days' : '90+ days'
          return {
            id: inv.invoiceId, invoiceNo: inv.invoiceNo,
            amount: Number(inv.balance), daysOutstanding: days, bucket,
          }
        }),
        total,
      }
    } catch { return { data: [], total: 0 } }
  }

  async getDunningQueue(_params: PaginationDto) {
    return { data: [], total: 0 }
  }

  private mockGSTSummary() {
    const months = ['2026-04', '2026-05', '2026-06']
    return months.map((period) => ({
      id: period, period, returnType: 'GSTR3B',
      gstOutput: 0, gstInput: 0, itcAvailable: 0, itcUtilized: 0, netPayable: 0,
      filingStatus: 'pending', filedDate: null, dueDate: `${period}-20`,
    }))
  }
}
