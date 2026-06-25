import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../auth/roles.guard';
import { CurrentUser, IpAddress, Roles } from '../../../common/decorators';
import { FinanceRole } from '../../../common/enums';
import { AuditContext, JwtPayload } from '../../../common/interfaces';
import { ReceivableService } from './receivable.service';
import { DunningService } from './dunning.service';
import { AgingFilterDto, DunningFilterDto } from './dto/receivable.dto';

@ApiTags('Receivables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fin/ar')
export class ReceivableController {
  constructor(
    private readonly receivableService: ReceivableService,
    private readonly dunningService: DunningService,
  ) {}

  private context(user: JwtPayload, ip: string): AuditContext {
    return { userId: user?.sub, ipAddress: ip };
  }

  @Get('aging/summary')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT, FinanceRole.CFO)
  @ApiOperation({ summary: 'AR aging bucket totals and KPIs' })
  agingSummary() {
    return this.receivableService.getAgingSummary();
  }

  @Get('aging')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT, FinanceRole.CFO)
  @ApiOperation({ summary: 'AR aging report grouped by customer' })
  aging(@Query() filter: AgingFilterDto) {
    return this.receivableService.getAging(filter);
  }

  @Get('dunning')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Active dunning queue (one row per customer)' })
  dunningQueue(@Query() filter: DunningFilterDto) {
    return this.dunningService.getDunningQueue(filter);
  }

  @Post('dunning/:customerId/remind')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Manually trigger a payment reminder for a customer' })
  remind(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.dunningService.triggerManualReminder(
      customerId,
      user.sub,
      this.context(user, ip),
    );
  }
}
