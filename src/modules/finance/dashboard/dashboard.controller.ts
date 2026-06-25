import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../auth/roles.guard';
import { Roles } from '../../../common/decorators';
import { FinanceRole } from '../../../common/enums';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.CFO)
  @ApiOperation({ summary: 'CFO KPIs — revenue, receivables, payables, margin' })
  getKPIs() {
    return this.dashboardService.getKPIs();
  }

  @Get('dashboard/revenue-trends')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.CFO)
  @ApiOperation({ summary: 'Monthly revenue vs expenses for a given year' })
  getRevenueTrends(@Query('year') year?: string) {
    const parsed = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.dashboardService.getRevenueTrends(parsed);
  }

  @Get('branch-performance')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.CFO)
  @ApiOperation({ summary: 'Per-branch revenue, expenses, profit, growth %' })
  getBranchPerformance() {
    return this.dashboardService.getBranchPerformance();
  }

  @Get('cash-health')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.CFO)
  @ApiOperation({ summary: 'Net liquidity, OPEX runway, health score, forecast' })
  getCashHealth() {
    return this.dashboardService.getCashHealth();
  }
}
