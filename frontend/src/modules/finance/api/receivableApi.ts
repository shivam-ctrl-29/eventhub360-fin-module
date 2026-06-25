import axiosInstance from '@shared/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, TableParams } from '../types/finance.common.types'
import type { ARAgingEntry, DunningRecord } from '../types/aging.types'

export const receivableApi = {
  getARAgingSummary: () =>
    axiosInstance.get<ApiResponse<{
      totalOutstanding: number
      avgCollectionDays: number
      buckets: Array<{ bucket: string; amount: number; count: number }>
    }>>('/api/fin/ar/aging/summary'),

  getARAgingEntries: (params: TableParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<ARAgingEntry>>>('/api/fin/ar/aging', { params }),

  getDunningQueue: (params: TableParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<DunningRecord>>>('/api/fin/ar/dunning', { params }),

  sendReminder: (customerId: string, level: string) =>
    axiosInstance.post<ApiResponse<{ sent: boolean }>>(`/api/fin/ar/dunning/${customerId}/remind`, { level }),
}
