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
import { PaymentService } from './payment.service';
import { RecordPaymentDto, PaymentFilterDto } from './dto/payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fin/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  private context(user: JwtPayload, ip: string): AuditContext {
    return { userId: user?.sub, ipAddress: ip };
  }

  @Get()
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTS_HEAD)
  @ApiOperation({ summary: 'List payments with filters & pagination' })
  findAll(@Query() filter: PaymentFilterDto) {
    return this.paymentService.findAll(filter);
  }

  @Post()
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTS_HEAD)
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  record(
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.paymentService.recordPayment(
      dto,
      user.sub,
      this.context(user, ip),
    );
  }

  @Get(':id/receipt')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTS_HEAD)
  @ApiOperation({ summary: 'Get a formatted receipt for a payment' })
  receipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.getReceipt(id);
  }
}
