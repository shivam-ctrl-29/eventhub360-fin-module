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
import { Roles, CurrentUser, IpAddress } from '../../../common/decorators';
import { FinanceRole } from '../../../common/enums';
import { JwtPayload, AuditContext } from '../../../common/interfaces';
import { ReconciliationService } from './reconciliation.service';
import {
  MatchReconciliationDto,
  ReconciliationFilterDto,
} from './dto/reconciliation.dto';

@ApiTags('Reconciliation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fin/reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  private context(user: JwtPayload, ip: string): AuditContext {
    return { userId: user?.sub, ipAddress: ip };
  }

  @Get()
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'List bank entries (filter by reconciled status)' })
  findAll(@Query() filter: ReconciliationFilterDto) {
    return this.reconciliationService.findAll(filter);
  }

  @Get(':id/suggestions')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Suggested invoice matches for a bank entry' })
  suggestions(@Param('id', ParseUUIDPipe) id: string) {
    return this.reconciliationService.suggestMatches(id);
  }

  @Post(':id/match')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Match a bank entry to an invoice' })
  match(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MatchReconciliationDto,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.reconciliationService.matchEntry(
      id,
      dto,
      user.sub,
      this.context(user, ip),
    );
  }

  @Post(':id/unmatch')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Remove a match from a reconciled bank entry' })
  unmatch(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.reconciliationService.unmatchEntry(
      id,
      user.sub,
      this.context(user, ip),
    );
  }
}
