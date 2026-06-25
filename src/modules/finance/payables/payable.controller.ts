import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../auth/roles.guard';
import { CurrentUser, IpAddress, Roles } from '../../../common/decorators';
import { FinanceRole } from '../../../common/enums';
import { AuditContext, JwtPayload } from '../../../common/interfaces';
import { PayableService } from './payable.service';
import {
  ApprovePayoutDto,
  DisbursePayoutDto,
  UploadBillDto,
  VendorBillFilterDto,
} from './dto/payable.dto';

@ApiTags('Payables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fin/ap')
export class PayableController {
  constructor(private readonly payableService: PayableService) {}

  private context(user: JwtPayload, ip: string): AuditContext {
    return { userId: user?.sub, ipAddress: ip };
  }

  @Get('bills')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT, FinanceRole.ACCOUNTS_HEAD)
  @ApiOperation({ summary: 'List vendor bills' })
  bills(@Query() filter: VendorBillFilterDto) {
    return this.payableService.getBills(filter);
  }

  @Post('bills/upload')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTANT)
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a vendor bill with optional document' })
  uploadBill(
    @Body() dto: UploadBillDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.payableService.uploadBill(dto, file, this.context(user, ip));
  }

  @Get('payouts')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTS_HEAD, FinanceRole.CFO)
  @ApiOperation({ summary: 'Pending and approved payout schedule' })
  payouts() {
    return this.payableService.getPayoutSchedule();
  }

  @Post('payouts/approve')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Approve one or more payouts' })
  approve(
    @Body() dto: ApprovePayoutDto,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.payableService.approvePayouts(
      dto,
      user.sub,
      this.context(user, ip),
    );
  }

  @Post('payouts/disburse')
  @Roles(FinanceRole.FINANCE_MANAGER, FinanceRole.ACCOUNTS_HEAD)
  @ApiOperation({ summary: 'Disburse approved payouts' })
  disburse(
    @Body() dto: DisbursePayoutDto,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.payableService.disbursePayouts(
      dto,
      user.sub,
      this.context(user, ip),
    );
  }
}
