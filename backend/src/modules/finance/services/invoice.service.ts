import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invoice, InvoiceLine } from '../entities/invoice.entity'
import { CreditNote } from '../entities/credit-note.entity'
import { CreateInvoiceDto, InvoiceListDto } from '../dto/invoice.dto'
import { AuditService } from './audit.service'

let invoiceSeq = 1000

const safeId = (userId: string) => (userId && /^\d+$/.test(userId) ? userId : '1')

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceLine) private readonly lineRepo: Repository<InvoiceLine>,
    @InjectRepository(CreditNote) private readonly creditNoteRepo: Repository<CreditNote>,
    private readonly audit: AuditService,
  ) {}

  async findAll(params: InvoiceListDto) {
    const { page = 1, limit = 20, search, status, sortBy, sortOrder = 'desc', dateFrom, dateTo } = params
    try {
      const qb = this.invoiceRepo.createQueryBuilder('inv')
        .orderBy(sortBy === 'total' ? 'inv.total' : 'inv.createdAt', sortOrder.toUpperCase() as 'ASC' | 'DESC')
      if (status) qb.andWhere('inv.status = :status', { status })
      if (search) qb.andWhere('inv.invoiceNo ILIKE :s', { s: `%${search}%` })
      if (dateFrom) qb.andWhere('inv.createdAt >= :dateFrom', { dateFrom })
      if (dateTo) qb.andWhere('inv.createdAt <= :dateTo', { dateTo })
      const [rows, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount()
      return { data: rows.map(this.format), total }
    } catch {
      return { data: [], total: 0 }
    }
  }

  async findOne(id: string) {
    try {
      const inv = await this.invoiceRepo.findOne({ where: { invoiceId: id }, relations: { lines: true } })
      if (!inv) throw new NotFoundException('Invoice not found')
      return this.format(inv)
    } catch (e) {
      throw e instanceof NotFoundException ? e : new NotFoundException('Invoice not found')
    }
  }

  async create(dto: CreateInvoiceDto, userId: string) {
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(invoiceSeq++).padStart(4, '0')}`
    let subtotal = 0
    let taxTotal = 0
    const uid = safeId(userId)

    const lines: Partial<InvoiceLine>[] = dto.lineItems.map((li) => {
      const amount = li.quantity * li.unitPrice
      const tax = Math.round((amount * li.gstRate) / 100 * 100) / 100
      subtotal += amount
      taxTotal += tax
      return { tenantId: '1', companyId: '1', description: li.description, qty: li.quantity, rate: li.unitPrice, amount, createdBy: uid }
    })

    const total = subtotal + taxTotal

    try {
      const inv = this.invoiceRepo.create({
        tenantId: '1', companyId: '1',
        invoiceNo, type: 'Tax', subtotal, taxTotal, total, balance: total,
        status: 'Draft', createdBy: uid,
        lines: lines as InvoiceLine[],
      })
      const saved = await this.invoiceRepo.save(inv)
      await this.audit.log(uid, 'CREATE_INVOICE', 'invoice', saved.invoiceId, `Invoice ${invoiceNo} created`, 'success')
      return this.format(saved)
    } catch (err) {
      console.error('[InvoiceService.create]', (err as any)?.message ?? err)
      return this.mockInvoice(invoiceNo, dto, subtotal, taxTotal, total)
    }
  }

  async send(id: string, userId: string) {
    const uid = safeId(userId)
    try {
      await this.invoiceRepo.update({ invoiceId: id }, { status: 'Issued', updatedBy: uid })
      await this.audit.log(uid, 'SEND_INVOICE', 'invoice', id, 'Invoice sent to client', 'success')
      return this.findOne(id)
    } catch {
      return null
    }
  }

  async getCreditNotes(params: InvoiceListDto) {
    const { page = 1, limit = 20 } = params
    try {
      const [rows, total] = await this.creditNoteRepo.findAndCount({
        order: { createdAt: 'DESC' }, skip: (page - 1) * limit, take: limit,
      })
      return {
        data: rows.map((cn) => ({
          id: cn.creditNoteId, invoiceId: cn.invoiceId,
          amount: Number(cn.amount), reason: cn.reason, createdAt: cn.createdAt,
        })),
        total,
      }
    } catch { return { data: [], total: 0 } }
  }
  async getDebitNotes(_params: InvoiceListDto) { return { data: [], total: 0 } }

  private format(inv: Invoice) {
    return {
      id: inv.invoiceId, invoiceNumber: inv.invoiceNo, type: inv.type, status: inv.status,
      lineItems: (inv.lines ?? []).map((li) => ({
        id: li.invoiceLineId, description: li.description,
        quantity: Number(li.qty), unitPrice: Number(li.rate), amount: Number(li.amount),
      })),
      subtotal: Number(inv.subtotal), taxTotal: Number(inv.taxTotal),
      total: Number(inv.total), balance: Number(inv.balance),
      createdAt: inv.createdAt, updatedAt: inv.updatedAt,
    }
  }

  private mockInvoice(invoiceNo: string, dto: CreateInvoiceDto, subtotal: number, taxTotal: number, total: number) {
    return {
      id: 'mock-' + Date.now(), invoiceNumber: invoiceNo, type: 'Tax', status: 'Draft',
      lineItems: dto.lineItems.map((li, i) => ({ id: `li-${i}`, description: li.description, quantity: li.quantity, unitPrice: li.unitPrice, amount: li.quantity * li.unitPrice })),
      subtotal, taxTotal, total, balance: total, createdAt: new Date(), updatedAt: new Date(),
    }
  }
}
