import type { InvoiceStatus } from '../types/invoice.types'

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  partial: 'Partial',
  Draft: 'Draft',
  Issued: 'Issued',
  Paid: 'Paid',
  Overdue: 'Overdue',
  Cancelled: 'Cancelled',
}

export const INVOICE_STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: '#94a3b8',
  sent: '#3b82f6',
  paid: '#059669',
  overdue: '#dc2626',
  cancelled: '#6b7280',
  partial: '#f59e0b',
  Draft: '#94a3b8',
  Issued: '#3b82f6',
  Paid: '#059669',
  Overdue: '#dc2626',
  Cancelled: '#6b7280',
}

export const INVOICE_STATUS_BG: Record<InvoiceStatus, string> = {
  draft: '#f1f5f9',
  sent: '#eff6ff',
  paid: '#ecfdf5',
  overdue: '#fef2f2',
  cancelled: '#f9fafb',
  partial: '#fffbeb',
  Draft: '#f1f5f9',
  Issued: '#eff6ff',
  Paid: '#ecfdf5',
  Overdue: '#fef2f2',
  Cancelled: '#f9fafb',
}
