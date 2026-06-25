import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { InvoiceService } from './invoice.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreateCreditNoteDto,
  CreateDebitNoteDto,
  InvoiceFilterDto,
} from './dto/invoice.dto';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fin/invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  private context(user: JwtPayload, ip: string): AuditContext {
    return { userId: user?.sub, ipAddress: ip };
  }

  @Get()
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'List invoices with filters & pagination' })
  findAll(@Query() filter: InvoiceFilterDto) {
    return this.invoiceService.findAll(filter);
  }

  @Post()
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Create a new draft invoice' })
  create(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.invoiceService.create(dto, user.sub, this.context(user, ip));
  }

  // ---- Static sub-routes declared BEFORE ':id' so they are not captured ----
  @Get('credit-notes')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'List all credit notes' })
  listCreditNotes() {
    return this.invoiceService.listCreditNotes();
  }

  @Post('credit-notes')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Create a credit note against an invoice' })
  createCreditNote(
    @Body() dto: CreateCreditNoteDto,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.invoiceService.createCreditNote(
      dto,
      user.sub,
      this.context(user, ip),
    );
  }

  @Get('debit-notes')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'List all debit notes' })
  listDebitNotes() {
    return this.invoiceService.listDebitNotes();
  }

  @Post('debit-notes')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Create a debit note' })
  createDebitNote(
    @Body() dto: CreateDebitNoteDto,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.invoiceService.createDebitNote(
      dto,
      user.sub,
      this.context(user, ip),
    );
  }

  @Get(':id')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Get a single invoice with line items & GST' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.findOne(id);
  }

  @Patch(':id')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Update an invoice (draft only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.invoiceService.update(id, dto, user.sub, this.context(user, ip));
  }

  @Post(':id/send')
  @Roles(FinanceRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Send an invoice to the customer (draft -> sent)' })
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @IpAddress() ip: string,
  ) {
    return this.invoiceService.sendInvoice(
      id,
      user.sub,
      this.context(user, ip),
    );
  }
}
