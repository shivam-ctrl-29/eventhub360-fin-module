import type { Customer } from './finance.common.types'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partial'
export type GSTRate = 0 | 5 | 12 | 18 | 28
export type PaymentMode = 'upi' | 'bank_transfer' | 'cheque' | 'cash' | 'card'

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  gstRate: GSTRate
  gstAmount: number
  total: number
}

export interface GSTBreakdown {
  rate: GSTRate
  taxableAmount: number
  cgst: number
  sgst: number
  igst: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customer: Customer
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  gstBreakdown: GSTBreakdown[]
  totalGST: number
  grandTotal: number
  paymentMode?: PaymentMode
  notes?: string
  termsAndConditions?: string
  createdAt: string
  updatedAt: string
}

export interface CreateInvoicePayload {
  customerId: string
  issueDate: string
  dueDate: string
  lineItems: Omit<InvoiceLineItem, 'id' | 'gstAmount' | 'total'>[]
  paymentMode?: PaymentMode
  notes?: string
}

export interface CreditNote {
  id: string
  creditNoteNumber: string
  originalInvoiceId: string
  originalInvoiceNumber: string
  customerId: string
  customerName: string
  reason: string
  lineItems: InvoiceLineItem[]
  totalAmount: number
  gstAmount: number
  grandTotal: number
  date: string
  status: 'issued' | 'applied' | 'cancelled'
}

export interface DebitNote {
  id: string
  debitNoteNumber: string
  originalInvoiceId: string
  originalInvoiceNumber: string
  vendorId: string
  vendorName: string
  reason: string
  lineItems: InvoiceLineItem[]
  totalAmount: number
  gstAmount: number
  grandTotal: number
  date: string
  status: 'issued' | 'applied' | 'cancelled'
}
