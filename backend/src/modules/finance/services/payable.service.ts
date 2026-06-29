import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Payout } from '../entities/payout-schedule.entity'
import { VendorBill } from '../entities/vendor-bill.entity'
import { PaginationDto } from '../dto/pagination.dto'
import { AuditService } from './audit.service'

const safeId = (userId: string) => (userId && /^\d+$/.test(userId) ? userId : '1')

@Injectable()
export class PayableService {
  constructor(
    @InjectRepository(Payout) private readonly payoutRepo: Repository<Payout>,
    @InjectRepository(VendorBill) private readonly billRepo: Repository<VendorBill>,
    private readonly audit: AuditService,
  ) {}

  async getBills(params: PaginationDto & { status?: string; search?: string }) {
    const { page = 1, limit = 20, status, search } = params
    try {
      const qb = this.billRepo.createQueryBuilder('b').where('b.isActive = true').orderBy('b.createdAt', 'DESC')
      if (status) qb.andWhere('b.status = :status', { status })
      if (search) qb.andWhere('(b.vendorName ILIKE :s OR b.billNumber ILIKE :s)', { s: `%${search}%` })
      const [rows, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount()
      return { data: rows.map((b) => this.formatBill(b)), total }
    } catch {
      return { data: [], total: 0 }
    }
  }

  async createBill(dto: any, fileName: string | null, userId: string) {
    const uid = safeId(userId)
    try {
      const amount = Number(dto.amount) || 0
      const gstAmount = Number(dto.gstAmount) || 0
      const billNumber = dto.billNumber || `VB-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`
      const bill = this.billRepo.create({
        tenantId: '1', companyId: '1',
        billNumber,
        vendorName: dto.vendorName,
        category: dto.category || 'miscellaneous',
        amount, gstAmount,
        totalAmount: amount + gstAmount,
        billDate: dto.billDate || null,
        dueDate: dto.dueDate || null,
        status: 'pending',
        fileName,
        createdBy: uid,
      })
      const saved = await this.billRepo.save(bill)
      await this.audit.log(uid, 'UPLOAD_BILL', 'vendor_bill', saved.id, `Vendor bill ${billNumber} uploaded`, 'success')
      return this.formatBill(saved)
    } catch (err) {
      console.error('[PayableService.createBill]', (err as any)?.message ?? err)
      return null
    }
  }

  private formatBill(b: VendorBill) {
    return {
      id: b.id, billNumber: b.billNumber, vendorName: b.vendorName,
      vendorId: '', category: b.category,
      amount: Number(b.amount), gstAmount: Number(b.gstAmount), totalAmount: Number(b.totalAmount),
      billDate: b.billDate, dueDate: b.dueDate, status: b.status,
      priority: 'medium', fileName: b.fileName, createdAt: b.createdAt,
    }
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
