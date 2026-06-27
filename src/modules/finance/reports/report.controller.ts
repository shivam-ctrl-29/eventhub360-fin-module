import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../auth/roles.guard';
import { Roles } from '../../../common/decorators';
import { FinanceRole } from '../../../common/enums';
import { ReportService } from './report.service';
import {
  AuditQueryDto,
  GstReportDto,
  HsnQueryDto,
  PnlQueryDto,
  TdsQueryDto,
} from './dto/report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fin/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('gst')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT, FinanceRole.AUDITOR, FinanceRole.CFO)
  @ApiOperation({ summary: 'GST filing summary for a financial year' })
  gst(@Query() dto: GstReportDto) {
    return this.reportService.getGstSummary(dto);
  }

  @Get('gst/compliance-score')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.AUDITOR, FinanceRole.CFO)
  @ApiOperation({ summary: 'GST compliance score and grade' })
  complianceScore() {
    return this.reportService.getGstComplianceScore();
  }

  @Get('gst/hsn')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT, FinanceRole.AUDITOR)
  @ApiOperation({ summary: 'HSN-wise GST breakdown' })
  hsn(@Query() query: HsnQueryDto) {
    return this.reportService.getHsnBreakdown(query);
  }

  @Get('tds')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT, FinanceRole.AUDITOR)
  @ApiOperation({ summary: 'TDS deduction register' })
  tds(@Query() query: TdsQueryDto) {
    return this.reportService.getTds(query);
  }

  @Get('pnl')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.AUDITOR, FinanceRole.CFO)
  @ApiOperation({ summary: 'Profit & loss summary' })
  pnl(@Query() query: PnlQueryDto) {
    return this.reportService.getPnl(query);
  }

  @Get('pnl/monthly')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.AUDITOR, FinanceRole.CFO)
  @ApiOperation({ summary: 'Month-by-month P&L for a financial year' })
  monthlyPnl(@Query() query: PnlQueryDto) {
    return this.reportService.getMonthlyPnl(query);
  }

  @Get('audit')
  @Roles(FinanceRole.AUDITOR, FinanceRole.FINANCE_MANAGER, FinanceRole.CFO)
  @ApiOperation({ summary: 'Immutable audit trail' })
  audit(@Query() query: AuditQueryDto) {
    return this.reportService.getAudit(query);
  }
}
