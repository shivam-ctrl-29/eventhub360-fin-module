import axiosInstance from '@shared/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, TableParams } from '../types/finance.common.types'
import type { VendorBill, PayoutScheduleItem } from '../types/expense.types'

export const payableApi = {
  getBills: (params: TableParams & { status?: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<VendorBill>>>('/api/fin/ap/bills', { params }),

  uploadBill: (formData: FormData) =>
    axiosInstance.post<ApiResponse<VendorBill>>('/api/fin/ap/bills/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getPayoutSchedule: (params: TableParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<PayoutScheduleItem>>>('/api/fin/ap/payouts', { params }),

  approvePayouts: (ids: string[]) =>
    axiosInstance.post<ApiResponse<{ approved: number }>>('/api/fin/ap/payouts/approve', { ids }),

  disburse: (ids: string[]) =>
    axiosInstance.post<ApiResponse<{ disbursed: number }>>('/api/fin/ap/payouts/disburse', { ids }),
}
