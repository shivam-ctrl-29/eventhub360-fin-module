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

export interface Receipt {
  id: string
  receiptNumber: string
  paymentId: string
  invoiceNumber: string
  customerName: string
  amount: number
  paymentMode: PaymentMode
  paymentDate: string
  utrNumber?: string
}
