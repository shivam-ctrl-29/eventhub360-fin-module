import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Payment } from '../entities/payment.entity'
import { Invoice } from '../entities/invoice.entity'
import { RecordPaymentDto, PaymentListDto } from '../dto/payment.dto'
import { AuditService } from './audit.service'

const safeId = (userId: string) => (userId && /^\d+$/.test(userId) ? userId : '1')

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    private readonly audit: AuditService,
  ) {}

  async findAll(params: PaymentListDto) {
    const { page = 1, limit = 20, sortBy, sortOrder = 'desc' } = params
    try {
      const qb = this.repo.createQueryBuilder('p')
        .orderBy(sortBy === 'amount' ? 'p.amount' : 'p.paidAt', sortOrder.toUpperCase() as 'ASC' | 'DESC')
      const [rows, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount()
      return { data: rows.map(this.format), total }
    } catch {
      return { data: [], total: 0 }
    }
  }

  async record(dto: RecordPaymentDto, userId: string) {
    const uid = safeId(userId)
    try {
      const pay = this.repo.create({
        tenantId: '1', companyId: '1',
        invoiceId: dto.invoiceId,
        mode: dto.paymentMode,
        amount: dto.amount,
        gatewayRef: dto.utrNumber ?? null,
        paidAt: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        createdBy: uid,
      })
      const saved = await this.repo.save(pay)

      // Recording a payment must reduce the invoice balance and roll its status
      // forward — otherwise the books never reflect that money came in.
      const inv = await this.invoiceRepo.findOne({ where: { invoiceId: dto.invoiceId } })
      if (inv) {
        const newBalance = Math.max(0, Number(inv.balance) - Number(dto.amount))
        await this.invoiceRepo.update(
          { invoiceId: dto.invoiceId },
          { balance: newBalance, status: newBalance <= 0 ? 'Paid' : 'Partial', updatedBy: uid },
        )
      }

      await this.audit.log(uid, 'RECORD_PAYMENT', 'payment', saved.paymentId, `Payment recorded for invoice ${dto.invoiceId}`, 'success')
      return this.format(saved)
    } catch (err) {
      // No mock fallback — a failed save must surface as an error, never fake success.
      console.error('[PaymentService.record]', (err as any)?.message ?? err)
      throw err
    }
  }

  async getReceipt(paymentId: string) {
    try {
      const pay = await this.repo.findOne({ where: { paymentId } })
      if (!pay) return null
      return { paymentId: pay.paymentId, invoiceId: pay.invoiceId, amount: Number(pay.amount), mode: pay.mode, gatewayRef: pay.gatewayRef, paidAt: pay.paidAt }
    } catch {
      return null
    }
  }

  private format(p: Payment) {
    return {
      id: p.paymentId, invoiceId: p.invoiceId,
      amount: Number(p.amount), mode: p.mode,
      gatewayRef: p.gatewayRef, paidAt: p.paidAt, createdAt: p.createdAt,
    }
  }
}
