import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common'
import { ReportService } from '../services/report.service'
import { PaginationDto } from '../dto/pagination.dto'
import { ok, paginated } from '../../../shared/response.helper'

@Controller()
export class ReportController {
  constructor(private readonly svc: ReportService) {}

  // GST & TDS
  @Get('fin/reports/gst')
  async getGST(@Query('financialYear') financialYear = '2026-27') {
    return ok(await this.svc.getGSTSummary(financialYear))
  }

  @Get('fin/reports/gst/compliance-score')
  async getComplianceScore() {
    return ok(await this.svc.getGSTComplianceScore())
  }

  @Get('fin/reports/gst/hsn')
  async getHSN(@Query() params: PaginationDto & { period: string }) {
    const { data, total } = await this.svc.getHSNBreakdown(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Get('fin/reports/tds')
  async getTDS(@Query() params: PaginationDto & { period: string }) {
    const { data, total } = await this.svc.getTDSEntries(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  // P&L
  @Get('fin/reports/pnl')
  async getPnL(@Query('eventId') eventId?: string) {
    return ok(await this.svc.getEventPnL(eventId))
  }

  @Get('fin/reports/pnl/monthly')
  async getMonthlyPnL(@Query('financialYear') financialYear = '2026-27') {
    return ok(await this.svc.getMonthlyPnL(financialYear))
  }

  // Audit trail
  @Get('fin/reports/audit')
  async getAuditTrail(@Query() params: PaginationDto & { action?: string; severity?: string }) {
    const { data, total } = await this.svc.getAuditTrail(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 50)
  }

  // AR Aging & Dunning
  @Get('fin/ar/aging/summary')
  async getARSummary() {
    return ok(await this.svc.getARAgingSummary())
  }

  @Get('fin/ar/aging')
  async getAREntries(@Query() params: PaginationDto) {
    const { data, total } = await this.svc.getARAgingEntries(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Get('fin/ar/dunning')
  async getDunning(@Query() params: PaginationDto) {
    const { data, total } = await this.svc.getDunningQueue(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Post('fin/ar/dunning/:customerId/remind')
  async sendReminder(@Param('customerId') customerId: string, @Body() body: { level: string }) {
    return ok({ sent: true }, 'Reminder sent')
  }
}
