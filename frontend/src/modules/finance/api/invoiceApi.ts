import axiosInstance from '@shared/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, TableParams } from '../types/finance.common.types'
import type { Invoice, CreateInvoicePayload, CreditNote, DebitNote } from '../types/invoice.types'

export interface InvoiceFilters extends TableParams {
  status?: string
  customerId?: string
  dateFrom?: string
  dateTo?: string
}

export const invoiceApi = {
  list: (params: InvoiceFilters) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Invoice>>>('/api/fin/invoices', { params }),

  get: (id: string) =>
    axiosInstance.get<ApiResponse<Invoice>>(`/api/fin/invoices/${id}`),

  create: (payload: CreateInvoicePayload) =>
    axiosInstance.post<ApiResponse<Invoice>>('/api/fin/invoices', payload),

  update: (id: string, payload: Partial<CreateInvoicePayload>) =>
    axiosInstance.patch<ApiResponse<Invoice>>(`/api/fin/invoices/${id}`, payload),

  send: (id: string) =>
    axiosInstance.post<ApiResponse<Invoice>>(`/api/fin/invoices/${id}/send`),

  getCreditNotes: (params: TableParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<CreditNote>>>('/api/fin/invoices/credit-notes', { params }),

  createCreditNote: (payload: Omit<CreditNote, 'id' | 'creditNoteNumber' | 'status'>) =>
    axiosInstance.post<ApiResponse<CreditNote>>('/api/fin/invoices/credit-notes', payload),

  getDebitNotes: (params: TableParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<DebitNote>>>('/api/fin/invoices/debit-notes', { params }),

  createDebitNote: (payload: Omit<DebitNote, 'id' | 'debitNoteNumber' | 'status'>) =>
    axiosInstance.post<ApiResponse<DebitNote>>('/api/fin/invoices/debit-notes', payload),
}
