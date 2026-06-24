import axiosInstance from '@shared/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, TableParams } from '../types/finance.common.types'
import type { Payment, Receipt } from '../types/payment.types'
import type { PaymentMode } from '../types/invoice.types'

export interface RecordPaymentPayload {
  invoiceId: string
  amount: number
  paymentMode: PaymentMode
  paymentDate: string
  utrNumber?: string
  chequeNumber?: string
  bankName?: string
  remarks?: string
}

export const paymentApi = {
  list: (params: TableParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Payment>>>('/api/fin/payments', { params }),

  record: (payload: RecordPaymentPayload) =>
    axiosInstance.post<ApiResponse<Payment>>('/api/fin/payments', payload),

  getReceipt: (paymentId: string) =>
    axiosInstance.get<ApiResponse<Receipt>>(`/api/fin/payments/${paymentId}/receipt`),
}
