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
import { ExpenseService } from './expense.service';
import {
  BudgetQueryDto,
  ExpenseFilterDto,
  RejectExpenseDto,
} from './dto/expense.dto';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fin/expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  private context(user: JwtPayload, ip: string): AuditContext {
    return { userId: user?.sub, ipAddress: ip };
  }

  @Get()
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT)
  @ApiOperation({ summary: 'List submitted expenses' })
  list(@Query() filter: ExpenseFilterDto) {
    return this.expenseService.list(filter);
  }

  @Get('budget')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT, FinanceRole.CFO)
  @ApiOperation({ summary: 'Budget vs actual by category for a month' })
  budget(@Query() query: BudgetQueryDto) {
    return this.expenseService.getBudget(query);
  }

  @Post(':id/approve')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Approve an expense claim' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.expenseService.approve(id, user.sub, this.context(user, ip));
  }

  @Post(':id/reject')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Reject an expense claim' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectExpenseDto,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.expenseService.reject(id, dto, user.sub, this.context(user, ip));
  }
}
