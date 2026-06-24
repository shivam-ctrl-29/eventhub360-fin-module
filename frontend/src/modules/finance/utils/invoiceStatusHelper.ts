import type { InvoiceStatus } from '../types/invoice.types'

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  partial: 'Partial',
}

export const INVOICE_STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: '#94a3b8',
  sent: '#3b82f6',
  paid: '#059669',
  overdue: '#dc2626',
  cancelled: '#6b7280',
  partial: '#f59e0b',
}

export const INVOICE_STATUS_BG: Record<InvoiceStatus, string> = {
  draft: '#f1f5f9',
  sent: '#eff6ff',
  paid: '#ecfdf5',
  overdue: '#fef2f2',
  cancelled: '#f9fafb',
  partial: '#fffbeb',
}
