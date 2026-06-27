import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Payout } from '../entities/payout-schedule.entity'
import { PaginationDto } from '../dto/pagination.dto'
import { AuditService } from './audit.service'

const safeId = (userId: string) => (userId && /^\d+$/.test(userId) ? userId : '1')

@Injectable()
export class PayableService {
  constructor(
    @InjectRepository(Payout) private readonly payoutRepo: Repository<Payout>,
    private readonly audit: AuditService,
  ) {}

  async getBills(_params: PaginationDto & { status?: string }) {
    return { data: [], total: 0 }
  }

  // Real AP (payables) aging: unpaid payouts bucketed by how overdue they are vs scheduled date.
  async getAPAgingSummary() {
    try {
      const payouts = await this.payoutRepo.find()
      const open = payouts.filter((p) => p.status !== 'paid')
      const now = Date.now()
      const buckets = [
        { bucket: 'Not due', amount: 0 },
        { bucket: '1-30 days', amount: 0 },
        { bucket: '31-60 days', amount: 0 },
        { bucket: '60+ days', amount: 0 },
      ]
      for (const p of open) {
        const amt = Number(p.amount)
        if (!p.scheduledDate) { buckets[0].amount += amt; continue }
        const days = Math.floor((now - new Date(p.scheduledDate).getTime()) / 86400000)
        if (days <= 0) buckets[0].amount += amt
        else if (days <= 30) buckets[1].amount += amt
        else if (days <= 60) buckets[2].amount += amt
        else buckets[3].amount += amt
      }
      const totalPayable = buckets.reduce((s, b) => s + b.amount, 0)
      return { totalPayable, openCount: open.length, buckets }
    } catch {
      return { totalPayable: 0, openCount: 0, buckets: [] }
    }
  }

  async getPayoutSchedule(params: PaginationDto) {
    const { page = 1, limit = 20 } = params
    try {
      const [rows, total] = await this.payoutRepo.findAndCount({ order: { scheduledDate: 'ASC' }, skip: (page - 1) * limit, take: limit })
      return { data: rows.map(this.formatPayout), total }
    } catch {
      return { data: [], total: 0 }
    }
  }

  async approvePayouts(ids: string[], userId: string) {
    const uid = safeId(userId)
    try {
      await this.payoutRepo.update({ payoutId: In(ids) }, { status: 'approved', updatedBy: uid })
      await this.audit.log(uid, 'APPROVE_PAYOUTS', 'payout', ids[0], `${ids.length} payouts approved`, 'success')
      return { approved: ids.length }
    } catch {
      return { approved: 0 }
    }
  }

  async disburse(ids: string[], userId: string) {
    const uid = safeId(userId)
    try {
      await this.payoutRepo.update({ payoutId: In(ids) }, { status: 'paid', paidAt: new Date(), updatedBy: uid })
      await this.audit.log(uid, 'DISBURSE_PAYOUTS', 'payout', ids[0], `${ids.length} payouts disbursed`, 'success')
      return { disbursed: ids.length }
    } catch {
      return { disbursed: 0 }
    }
  }

  private formatPayout(p: Payout) {
    return {
      id: p.payoutId, vendorInvoiceId: p.vendorInvoiceId,
      amount: Number(p.amount), scheduledDate: p.scheduledDate,
      status: p.status, paidAt: p.paidAt, createdAt: p.createdAt,
    }
  }
}
