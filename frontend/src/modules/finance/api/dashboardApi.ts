import axiosInstance from '@shared/api/axiosInstance'
import type { ApiResponse } from '../types/finance.common.types'
import type { BranchPnL, MonthlyPnL } from '../types/pnl.types'

export interface DashboardKPIs {
  totalRevenue: number
  receivables: number
  payables: number
  eventMargin: number
  taxLiability: number
  cashForecast: number
}

export interface CashHealthData {
  netLiquidity: number
  opexRunway: number
  healthScore: number
  weeklyForecast: Array<{ week: string; historical: number; projected: number }>
}

export interface ExpenseDistributionSlice {
  category: string
  amount: number
  pct: number
}

export const dashboardApi = {
  getKPIs: () =>
    axiosInstance.get<ApiResponse<DashboardKPIs>>('/api/fin/dashboard'),

  getRevenueTrends: (params: { year: number }) =>
    axiosInstance.get<ApiResponse<MonthlyPnL[]>>('/api/fin/dashboard/revenue-trends', { params }),

  getExpenseDistribution: () =>
    axiosInstance.get<ApiResponse<ExpenseDistributionSlice[]>>('/api/fin/dashboard/expense-distribution'),

  getBranchPerformance: () =>
    axiosInstance.get<ApiResponse<BranchPnL[]>>('/api/fin/branch-performance'),

  getCashHealth: () =>
    axiosInstance.get<ApiResponse<CashHealthData>>('/api/fin/cash-health'),
}
