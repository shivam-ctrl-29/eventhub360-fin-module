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
