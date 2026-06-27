import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AuditTrailService } from '../../../shared/audit/audit-trail.service';
import { FinanceGateway } from '../../../shared/socket/finance.gateway';
import {
  AuditAction,
  AuditSeverity,
  ExpenseStatus,
} from '../../../common/enums';
import { SOCKET_EVENTS } from '../../../common/constants';
import { AuditContext } from '../../../common/interfaces';
import {
  BudgetQueryDto,
  ExpenseFilterDto,
  RejectExpenseDto,
} from './dto/expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditTrailService,
    private readonly gateway: FinanceGateway,
  ) {}

  private num(value: unknown): number {
    return value === null || value === undefined ? 0 : Number(value);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  async list(filter: ExpenseFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.search
        ? {
            OR: [
              { description: { contains: filter.search, mode: 'insensitive' as const } },
              { employeeId: { contains: filter.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [expenses, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        orderBy: { submittedDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: expenses.map((e) => ({
        id: e.id,
        employeeId: e.employeeId,
        employeeName: e.employeeId,
        category: e.category,
        description: e.description,
        amount: this.num(e.amount),
        receiptUrl: e.receiptUrl,
        submittedDate: e.submittedDate,
        status: e.status,
        approvedBy: e.approvedBy,
        approvedDate: e.approvedDate,
        remarks: e.remarks,
        ocrAmount: e.ocrAmount === null ? null : this.num(e.ocrAmount),
        ocrFlagged: e.ocrFlagged,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approve(id: string, userId: string, context: AuditContext) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        `Expense already ${expense.status}; only pending expenses can be approved`,
      );
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.APPROVED,
        approvedBy: userId,
        approvedDate: new Date(),
      },
    });

    await this.audit.log({
      action: AuditAction.EXPENSE_APPROVED,
      entity: 'expense',
      entityId: id,
      description: `Expense of Rs ${this.num(expense.amount)} approved`,
      severity: AuditSeverity.SUCCESS,
      context,
    });

    this.gateway.emit(SOCKET_EVENTS.EXPENSE_APPROVED, {
      expenseId: id,
      amount: this.num(expense.amount),
      employeeId: expense.employeeId,
    });

    return updated;
  }

  async reject(
    id: string,
    dto: RejectExpenseDto,
    userId: string,
    context: AuditContext,
  ) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        `Expense already ${expense.status}; only pending expenses can be rejected`,
      );
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.REJECTED,
        approvedBy: userId,
        approvedDate: new Date(),
        remarks: dto.reason,
      },
    });

    await this.audit.log({
      action: AuditAction.EXPENSE_REJECTED,
      entity: 'expense',
      entityId: id,
      description: `Expense rejected: ${dto.reason}`,
      severity: AuditSeverity.WARNING,
      context,
    });

    return updated;
  }

  async getBudget(query: BudgetQueryDto) {
    const { month, year } = query;

    const budgets = await this.prisma.expenseBudget.findMany({
      where: { month, year },
    });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const grouped = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        submittedDate: { gte: start, lt: end },
        status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.REIMBURSED] },
      },
      _sum: { amount: true },
    });

    const actualByCategory = new Map<string, number>();
    for (const g of grouped) {
      actualByCategory.set(g.category, this.num(g._sum.amount));
    }

    return budgets.map((b) => {
      const budgeted = this.num(b.budgeted);
      const actual = actualByCategory.get(b.category) || 0;
      const variance = budgeted - actual;
      const variancePercent =
        budgeted > 0 ? this.round((variance / budgeted) * 100) : 0;
      return {
        category: b.category,
        budgeted: this.round(budgeted),
        actual: this.round(actual),
        variance: this.round(variance),
        variancePercent,
      };
    });
  }
}
