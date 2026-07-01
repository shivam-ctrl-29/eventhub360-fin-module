import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Payment } from '../entities/payment.entity'
import { AuditService } from './audit.service'
import { PaginationDto } from '../dto/pagination.dto'

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    private readonly audit: AuditService,
  ) {}

  async findAll(params: PaginationDto & { reconciled?: boolean }) {
    const { page = 1, limit = 20, reconciled } = params
    try {
      const where = reconciled !== undefined ? { isReconciled: reconciled } : {}
      const [rows, total] = await this.paymentRepo.findAndCount({
        where,
        order: { paidAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      })
      return {
        data: rows.map((p) => ({
          id: p.paymentId, invoiceId: p.invoiceId, amount: Number(p.amount),
          mode: p.mode, gatewayRef: p.gatewayRef, paidAt: p.paidAt,
          isReconciled: !!p.isReconciled,
          matchedInvoiceId: p.matchedInvoiceId,
          updatedAt: p.updatedAt,
        })),
        total,
      }
    } catch {
      return { data: [], total: 0 }
    }
  }

  async match(entryId: string, invoiceId: string, userId: string) {
    try {
      await this.paymentRepo.update(
        { paymentId: entryId },
        { isReconciled: true, matchedInvoiceId: invoiceId, updatedBy: userId },
      )
      await this.audit.log(userId, 'RECONCILE_ENTRY', 'payment', entryId, `Matched to invoice ${invoiceId}`, 'success')
      return { id: entryId, matchedInvoiceId: invoiceId, isReconciled: true }
    } catch {
      return null
    }
  }

  async unmatch(entryId: string, userId: string) {
    try {
      await this.paymentRepo.update(
        { paymentId: entryId },
        { isReconciled: false, matchedInvoiceId: null, updatedBy: userId },
      )
      await this.audit.log(userId, 'UNMATCH_ENTRY', 'payment', entryId, 'Reconciliation removed', 'warning')
      return { id: entryId, matchedInvoiceId: null, isReconciled: false }
    } catch {
      return null
    }
  }
}
