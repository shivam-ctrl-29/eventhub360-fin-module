import type { PaymentMode } from './invoice.types'

export type PaymentStatus = 'settled' | 'processing' | 'pending' | 'failed' | 'refunded'

export interface Payment {
  id: string
  paymentNumber: string
  invoiceId: string
  invoiceNumber: string
  customerName: string
  amount: number
  paymentMode: PaymentMode
  utrNumber?: string
  chequeNumber?: string
  bankName?: string
  status: PaymentStatus
  paymentDate: string
  remarks?: string
  createdAt: string
  /** Raw backend fields (payment table sends mode/gatewayRef/paidAt) */
  mode?: string
  gatewayRef?: string | null
  paidAt?: string
}

export interface ReconciliationEntry {
  id: string
  bankDescription: string
  utrNumber: string
  amount: number
  date: string
  matchedInvoiceId?: string
  matchedInvoiceNumber?: string
  isReconciled: boolean
  updatedAt?: string
}

// Matches what GET /fin/payments/:id/receipt actually returns.
export interface Receipt {
  paymentId: string
  invoiceId: string
  amount: number
  mode: string
  gatewayRef?: string | null
  paidAt: string
}
