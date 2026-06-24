import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common'
import { ReconciliationService } from '../services/reconciliation.service'
import { PaginationDto } from '../dto/pagination.dto'
import { ok, paginated } from '../../../shared/response.helper'

const DEMO_USER = '1'

@Controller('fin/reconciliation')
export class ReconciliationController {
  constructor(private readonly svc: ReconciliationService) {}

  @Get()
  async list(@Query() params: PaginationDto & { reconciled?: string }) {
    const reconciled = params.reconciled !== undefined ? params.reconciled === 'true' : undefined
    const { data, total } = await this.svc.findAll({ ...params, reconciled })
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Post(':id/match')
  async match(@Param('id') id: string, @Body() body: { invoiceId: string }) {
    return ok(await this.svc.match(id, body.invoiceId, DEMO_USER), 'Entry matched')
  }

  @Post(':id/unmatch')
  async unmatch(@Param('id') id: string) {
    return ok(await this.svc.unmatch(id, DEMO_USER), 'Match removed')
  }
}
