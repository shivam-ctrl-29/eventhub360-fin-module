import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { PayableService } from '../services/payable.service'
import { PaginationDto } from '../dto/pagination.dto'
import { ok, paginated } from '../../../shared/response.helper'

const DEMO_USER = 'system'

@Controller('fin/ap')
export class PayableController {
  constructor(private readonly svc: PayableService) {}

  @Get('bills')
  async getBills(@Query() params: PaginationDto & { status?: string }) {
    const { data, total } = await this.svc.getBills(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Post('bills/upload')
  async uploadBill() {
    return ok({ id: 'mock-' + Date.now(), status: 'pending' }, 'Bill uploaded')
  }

  @Get('payouts')
  async getPayouts(@Query() params: PaginationDto) {
    const { data, total } = await this.svc.getPayoutSchedule(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Post('payouts/approve')
  async approvePayouts(@Body() body: { ids: string[] }) {
    return ok(await this.svc.approvePayouts(body.ids, DEMO_USER), 'Payouts approved')
  }

  @Post('payouts/disburse')
  async disburse(@Body() body: { ids: string[] }) {
    return ok(await this.svc.disburse(body.ids, DEMO_USER), 'Payouts disbursed')
  }
}
