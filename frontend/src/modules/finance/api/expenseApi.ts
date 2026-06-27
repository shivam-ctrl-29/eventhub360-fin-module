import axiosInstance from '@shared/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, TableParams } from '../types/finance.common.types'
import type { Expense, ExpenseBudget } from '../types/expense.types'

export const expenseApi = {
  list: (params: TableParams & { status?: string; category?: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Expense>>>('/api/fin/expenses', { params }),

  create: (payload: { category: string; description: string; amount: number; submittedDate: string }) =>
    axiosInstance.post<ApiResponse<Expense>>('/api/fin/expenses', payload),

  approve: (id: string) =>
    axiosInstance.post<ApiResponse<Expense>>(`/api/fin/expenses/${id}/approve`),

  reject: (id: string, reason: string) =>
    axiosInstance.post<ApiResponse<Expense>>(`/api/fin/expenses/${id}/reject`, { reason }),

  getBudgetVsActual: (params: { month: string; year: number }) =>
    axiosInstance.get<ApiResponse<ExpenseBudget[]>>('/api/fin/expenses/budget', { params }),
}
