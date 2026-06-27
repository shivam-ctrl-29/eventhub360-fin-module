import { Controller, Get, Query } from '@nestjs/common'
import { DashboardService } from '../services/dashboard.service'
import { ok } from '../../../shared/response.helper'

@Controller()
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('fin/dashboard')
  async getKPIs() {
    return ok(await this.svc.getKPIs())
  }

  @Get('fin/dashboard/revenue-trends')
  async getRevenueTrends(@Query('year') year = new Date().getFullYear()) {
    return ok(await this.svc.getRevenueTrends(Number(year)))
  }

  @Get('fin/dashboard/expense-distribution')
  async getExpenseDistribution() {
    return ok(await this.svc.getExpenseDistribution())
  }

  @Get('fin/branch-performance')
  async getBranchPerformance() {
    return ok(await this.svc.getBranchPerformance())
  }

  @Get('fin/cash-health')
  async getCashHealth() {
    return ok(await this.svc.getCashHealth())
  }
}
