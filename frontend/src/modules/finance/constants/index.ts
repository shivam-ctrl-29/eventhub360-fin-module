import type { GSTRate } from '../types/invoice.types'

export const GST_RATES: GSTRate[] = [0, 5, 12, 18, 28]

export const PAYMENT_MODES = [
  { value: 'upi',           label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'cash',          label: 'Cash' },
  { value: 'card',          label: 'Card' },
] as const

export const AGING_BUCKETS = [
  { key: 'current',   label: 'Current',  color: '#059669' },
  { key: '1-30',      label: '1-30 Days', color: '#f59e0b' },
  { key: '31-60',     label: '31-60 Days', color: '#f97316' },
  { key: '61-90',     label: '61-90 Days', color: '#ef4444' },
  { key: '90+',       label: '90+ Days',  color: '#7c3aed' },
] as const

export const DUNNING_LEVELS = [
  { level: 'L1', label: 'Soft Reminder',    color: '#f59e0b' },
  { level: 'L2', label: 'Follow-up Call',   color: '#f97316' },
  { level: 'L3', label: 'Demand Letter',    color: '#ef4444' },
] as const

export const EXPENSE_CATEGORIES = [
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'logistics',     label: 'Logistics' },
  { value: 'travel',        label: 'Travel' },
  { value: 'marketing',     label: 'Marketing' },
  { value: 'venue',         label: 'Venue' },
  { value: 'decor',         label: 'Decor' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
] as const

export const FINANCE_API_BASE = '/api/fin'

export const DEFAULT_PAGE_SIZE = 20
