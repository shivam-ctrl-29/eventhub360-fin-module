import {
  Controller, Get, Post, Patch, Param, Body, Query,
} from '@nestjs/common'
import { InvoiceService } from '../services/invoice.service'
import { CreateInvoiceDto, InvoiceListDto, CreateCreditNoteDto } from '../dto/invoice.dto'
import { ok, paginated } from '../../../shared/response.helper'

const DEMO_USER = 'system'

@Controller('fin/invoices')
export class InvoiceController {
  constructor(private readonly svc: InvoiceService) {}

  @Get()
  async list(@Query() params: InvoiceListDto) {
    const { data, total } = await this.svc.findAll(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Get('credit-notes')
  async getCreditNotes(@Query() params: InvoiceListDto) {
    const { data, total } = await this.svc.getCreditNotes(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Get('debit-notes')
  async getDebitNotes(@Query() params: InvoiceListDto) {
    const { data, total } = await this.svc.getDebitNotes(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return ok(await this.svc.findOne(id))
  }

  @Post()
  async create(@Body() body: CreateInvoiceDto) {
    return ok(await this.svc.create(body, DEMO_USER), 'Invoice created')
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Partial<CreateInvoiceDto>) {
    return ok(await this.svc.findOne(id))
  }

  @Post(':id/send')
  async send(@Param('id') id: string) {
    return ok(await this.svc.send(id, DEMO_USER), 'Invoice sent')
  }

  @Post('credit-notes')
  async createCreditNote(@Body() body: CreateCreditNoteDto) {
    return ok({ id: 'mock', ...body }, 'Credit note created')
  }

  @Post('debit-notes')
  async createDebitNote(@Body() body: Record<string, unknown>) {
    return ok({ id: 'mock', ...body }, 'Debit note created')
  }
}
