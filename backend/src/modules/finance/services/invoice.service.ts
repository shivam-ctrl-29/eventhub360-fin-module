import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invoice, InvoiceLine } from '../entities/invoice.entity'
import { CreditNote } from '../entities/credit-note.entity'
import { CreateInvoiceDto, InvoiceListDto, CreateCreditNoteDto } from '../dto/invoice.dto'
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
      if (status) qb.andWhere('LOWER(inv.status) = LOWER(:status)', { status })
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
      // No mock fallback — a failed save must surface as an error, never fake success.
      console.error('[InvoiceService.create]', (err as any)?.message ?? err)
      throw err
    }
  }

  async update(id: string, dto: Partial<CreateInvoiceDto>, userId: string) {
    const uid = safeId(userId)
    const inv = await this.invoiceRepo.findOne({ where: { invoiceId: id }, relations: { lines: true } })
    if (!inv) throw new NotFoundException('Invoice not found')

    if (dto.lineItems?.length) {
      await this.lineRepo.delete({ invoiceId: id })
      let subtotal = 0
      let taxTotal = 0
      const lines: Partial<InvoiceLine>[] = dto.lineItems.map((li) => {
        const amount = li.quantity * li.unitPrice
        const tax = Math.round((amount * li.gstRate) / 100 * 100) / 100
        subtotal += amount
        taxTotal += tax
        return { tenantId: '1', companyId: '1', description: li.description, qty: li.quantity, rate: li.unitPrice, amount, createdBy: uid }
      })
      inv.lines = lines as InvoiceLine[]
      inv.subtotal = subtotal
      inv.taxTotal = taxTotal
      inv.total = subtotal + taxTotal
      inv.balance = inv.total
    }
    inv.updatedBy = uid

    await this.invoiceRepo.save(inv)
    await this.audit.log(uid, 'UPDATE_INVOICE', 'invoice', id, `Invoice ${inv.invoiceNo} updated`, 'success')
    return this.findOne(id)
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
    return this.getNotes(params, 'credit')
  }

  async getDebitNotes(params: InvoiceListDto) {
    return this.getNotes(params, 'debit')
  }

  private async getNotes(params: InvoiceListDto, noteType: 'credit' | 'debit') {
    const { page = 1, limit = 20 } = params
    const [rows, total] = await this.creditNoteRepo.findAndCount({
      where: { noteType },
      order: { createdAt: 'DESC' }, skip: (page - 1) * limit, take: limit,
    })
    // Resolve invoice numbers for display in one query
    const invoiceIds = [...new Set(rows.map((cn) => cn.invoiceId))]
    const invoices = invoiceIds.length
      ? await this.invoiceRepo.createQueryBuilder('inv').where('inv.invoiceId IN (:...ids)', { ids: invoiceIds }).getMany()
      : []
    const numberById = new Map(invoices.map((inv) => [String(inv.invoiceId), inv.invoiceNo]))
    return {
      data: rows.map((cn) => ({
        id: cn.creditNoteId, invoiceId: cn.invoiceId,
        originalInvoiceNumber: numberById.get(String(cn.invoiceId)) ?? `#${cn.invoiceId}`,
        amount: Number(cn.amount), reason: cn.reason, createdAt: cn.createdAt,
      })),
      total,
    }
  }

  async createNote(dto: CreateCreditNoteDto, noteType: 'credit' | 'debit', userId: string) {
    const uid = safeId(userId)
    // The form accepts either an internal id or an invoice number like INV-2026-0001
    const ref = dto.originalInvoiceId.trim()
    const inv = await this.invoiceRepo.createQueryBuilder('inv')
      .where('inv.invoiceNo ILIKE :no', { no: ref })
      .orWhere(/^\d+$/.test(ref) ? 'inv.invoiceId = :id' : '1=0', { id: ref })
      .getOne()
    if (!inv) throw new NotFoundException(`Invoice "${ref}" not found`)

    const note = this.creditNoteRepo.create({
      tenantId: '1', companyId: '1',
      invoiceId: inv.invoiceId, noteType,
      amount: dto.grandTotal, reason: dto.reason || '—',
      createdBy: uid,
    })
    const saved = await this.creditNoteRepo.save(note)
    await this.audit.log(uid, noteType === 'credit' ? 'CREATE_CREDIT_NOTE' : 'CREATE_DEBIT_NOTE', 'credit_note', saved.creditNoteId, `${noteType === 'credit' ? 'Credit' : 'Debit'} note of ${dto.grandTotal} against ${inv.invoiceNo}`, 'success')
    return {
      id: saved.creditNoteId, invoiceId: saved.invoiceId,
      originalInvoiceNumber: inv.invoiceNo,
      amount: Number(saved.amount), reason: saved.reason, createdAt: saved.createdAt,
    }
  }

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

}
