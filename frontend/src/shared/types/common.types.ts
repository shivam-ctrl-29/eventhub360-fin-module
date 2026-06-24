export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export type SortOrder = 'asc' | 'desc'

export interface TableParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: SortOrder
  search?: string
}
