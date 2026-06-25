export type DunningLevel = 'L1' | 'L2' | 'L3'
export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+'

export interface ARAgingEntry {
  customerId: string
  customerName: string
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  days90plus: number
  total: number
  dunningLevel?: DunningLevel
  lastContactDate?: string
}

export interface APAgingEntry {
  vendorId: string
  vendorName: string
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  days90plus: number
  total: number
}

export interface DunningRecord {
  id: string
  customerId: string
  customerName: string
  outstandingAmount: number
  dunningLevel: DunningLevel
  lastActionDate: string
  nextActionDate: string
  emailsSent: number
  status: 'active' | 'resolved' | 'escalated'
}
