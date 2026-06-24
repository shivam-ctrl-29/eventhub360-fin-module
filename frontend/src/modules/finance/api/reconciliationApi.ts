import axiosInstance from '@shared/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, TableParams } from '../types/finance.common.types'
import type { ReconciliationEntry } from '../types/payment.types'

export const reconciliationApi = {
  list: (params: TableParams & { reconciled?: boolean }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<ReconciliationEntry>>>('/api/fin/reconciliation', { params }),

  match: (entryId: string, invoiceId: string) =>
    axiosInstance.post<ApiResponse<ReconciliationEntry>>(`/api/fin/reconciliation/${entryId}/match`, { invoiceId }),

  unmatch: (entryId: string) =>
    axiosInstance.post<ApiResponse<ReconciliationEntry>>(`/api/fin/reconciliation/${entryId}/unmatch`),
}
