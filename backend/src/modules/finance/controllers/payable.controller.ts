import { Controller, Get, Post, Body, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { PayableService } from '../services/payable.service'
import { PaginationDto } from '../dto/pagination.dto'
import { ok, paginated } from '../../../shared/response.helper'

const DEMO_USER = '1'
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

@Controller('fin/ap')
export class PayableController {
  constructor(private readonly svc: PayableService) {}

  @Get('bills')
  async getBills(@Query() params: PaginationDto & { status?: string; search?: string }) {
    const { data, total } = await this.svc.getBills(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Post('bills/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async uploadBill(@UploadedFile() file: any, @Body() body: any) {
    if (!file) throw new BadRequestException('A bill file is required')
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported file type. Upload a PDF, PNG, or JPG.')
    }
    if (!body?.vendorName || !body?.amount) {
      throw new BadRequestException('Vendor name and amount are required')
    }
    const created = await this.svc.createBill(body, file.originalname, DEMO_USER)
    if (!created) throw new BadRequestException('Could not save the bill')
    return ok(created, 'Bill uploaded successfully')
  }

  @Get('aging/summary')
  async getAPAgingSummary() {
    return ok(await this.svc.getAPAgingSummary())
  }

  @Get('payouts')
  async getPayouts(@Query() params: PaginationDto) {
    const { data, total } = await this.svc.getPayoutSchedule(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Post('payouts/approve')
  async approvePayouts(@Body() body: { ids: string[] }) {
    return ok(await this.svc.approvePayouts(body.ids, DEMO_USER), 'Payouts approved')
  }

  @Post('payouts/disburse')
  async disburse(@Body() body: { ids: string[] }) {
    return ok(await this.svc.disburse(body.ids, DEMO_USER), 'Payouts disbursed')
  }
}
