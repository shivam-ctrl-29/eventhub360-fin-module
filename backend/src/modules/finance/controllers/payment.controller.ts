import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common'
import { PaymentService } from '../services/payment.service'
import { RecordPaymentDto, PaymentListDto } from '../dto/payment.dto'
import { ok, paginated } from '../../../shared/response.helper'

const DEMO_USER = 'system'

@Controller('fin/payments')
export class PaymentController {
  constructor(private readonly svc: PaymentService) {}

  @Get()
  async list(@Query() params: PaymentListDto) {
    const { data, total } = await this.svc.findAll(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Post()
  async record(@Body() body: RecordPaymentDto) {
    return ok(await this.svc.record(body, DEMO_USER), 'Payment recorded')
  }

  @Get(':id/receipt')
  async getReceipt(@Param('id') id: string) {
    return ok(await this.svc.getReceipt(id))
  }
}
