import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common'
import { ExpenseService } from '../services/expense.service'
import { ExpenseListDto, RejectExpenseDto, CreateExpenseDto } from '../dto/expense.dto'
import { ok, paginated } from '../../../shared/response.helper'

const DEMO_USER = '1'

@Controller('fin/expenses')
export class ExpenseController {
  constructor(private readonly svc: ExpenseService) {}

  @Post()
  async create(@Body() dto: CreateExpenseDto) {
    return ok(await this.svc.create(dto, DEMO_USER), 'Expense created')
  }

  @Get()
  async list(@Query() params: ExpenseListDto) {
    const { data, total } = await this.svc.findAll(params)
    return paginated(data, total, params.page ?? 1, params.limit ?? 20)
  }

  @Get('budget')
  async getBudget(@Query() params: { month: string; year: string }) {
    return ok(await this.svc.getBudgetVsActual({ month: params.month, year: Number(params.year) }))
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string) {
    return ok(await this.svc.approve(id, DEMO_USER), 'Expense approved')
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body() body: RejectExpenseDto) {
    return ok(await this.svc.reject(id, DEMO_USER, body.reason), 'Expense rejected')
  }
}
