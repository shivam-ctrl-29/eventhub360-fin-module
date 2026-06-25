export type PLCategory = 'revenue' | 'venue' | 'catering' | 'decor' | 'logistics' | 'travel' | 'marketing' | 'staff' | 'miscellaneous'

export interface PLLineItem {
  id: string
  category: PLCategory
  description: string
  budgeted: number
  actual: number
  variance: number
  variancePercent: number
}

export interface EventPnL {
  eventId: string
  eventName: string
  eventDate: string
  clientName: string
  totalRevenue: number
  totalExpenses: number
  grossProfit: number
  grossMargin: number
  netProfit: number
  netMargin: number
  lineItems: PLLineItem[]
}

export interface MonthlyPnL {
  month: string
  revenue: number
  expenses: number
  grossProfit: number
  netProfit: number
}

export interface BranchPnL {
  branchId: string
  branchName: string
  revenue: number
  expenses: number
  profit: number
  margin: number
  growthPercent: number
}
