export type Currency = 'INR'
export type SortOrder = 'asc' | 'desc'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface TableParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
  search?: string
}

export interface DateRange {
  from: string
  to: string
}

export interface MoneyAmount {
  amount: number
  currency: Currency
}

export interface Branch {
  id: string
  name: string
  code: string
}

export interface Vendor {
  id: string
  name: string
  gstin?: string
  pan?: string
  email: string
  phone?: string
}

export interface Customer {
  id: string
  name: string
  gstin?: string
  pan?: string
  email: string
  phone?: string
  creditLimit?: number
}
