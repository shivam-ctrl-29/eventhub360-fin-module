import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Expense } from '../entities/expense.entity'
import { ExpenseListDto } from '../dto/expense.dto'
import { AuditService } from './audit.service'

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense) private readonly repo: Repository<Expense>,
    private readonly audit: AuditService,
  ) {}

  async findAll(params: ExpenseListDto) {
    const { page = 1, limit = 20, search, status, category } = params
    try {
      const qb = this.repo.createQueryBuilder('e').orderBy('e.createdAt', 'DESC')
      if (status) qb.andWhere('e.status = :status', { status })
      if (category) qb.andWhere('e.category = :category', { category })
      if (search) qb.andWhere('(e.description ILIKE :s OR e.category ILIKE :s)', { s: `%${search}%` })
      const [rows, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount()
      return { data: rows.map(this.format), total }
    } catch {
      return { data: [], total: 0 }
    }
  }

  async approve(id: string, userId: string) {
    try {
      await this.repo.update({ expenseId: id }, { status: 'approved', approvedBy: userId, updatedBy: userId })
      await this.audit.log(userId, 'APPROVE_EXPENSE', 'expense', id, 'Expense approved', 'success')
      const e = await this.repo.findOne({ where: { expenseId: id } })
      return e ? this.format(e) : null
    } catch {
      return null
    }
  }

  async reject(id: string, userId: string, _reason: string) {
    try {
      await this.repo.update({ expenseId: id }, { status: 'rejected', approvedBy: userId, updatedBy: userId })
      await this.audit.log(userId, 'REJECT_EXPENSE', 'expense', id, `Expense rejected: ${_reason}`, 'warning')
      const e = await this.repo.findOne({ where: { expenseId: id } })
      return e ? this.format(e) : null
    } catch {
      return null
    }
  }

  async getBudgetVsActual(_params: { month: string; year: number }) {
    return [
      { category: 'food_beverage', budgeted: 150000, actual: 0, variance: 150000 },
      { category: 'logistics',     budgeted: 80000,  actual: 0, variance: 80000 },
      { category: 'travel',        budgeted: 50000,  actual: 0, variance: 50000 },
      { category: 'marketing',     budgeted: 100000, actual: 0, variance: 100000 },
      { category: 'venue',         budgeted: 200000, actual: 0, variance: 200000 },
      { category: 'decor',         budgeted: 120000, actual: 0, variance: 120000 },
      { category: 'miscellaneous', budgeted: 30000,  actual: 0, variance: 30000 },
    ]
  }

  private format(e: Expense) {
    return {
      id: e.expenseId,
      category: e.category,
      description: e.description,
      amount: Number(e.amount),
      receiptUrl: e.receiptUrl,
      status: e.status,
      approvedBy: e.approvedBy,
      createdAt: e.createdAt,
    }
  }
}
