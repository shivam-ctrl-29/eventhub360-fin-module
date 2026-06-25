import type { GSTRate } from './invoice.types'

export type GSTReturnType = 'GSTR1' | 'GSTR2A' | 'GSTR3B'
export type TDSSection = '194C' | '194J' | '194I' | '194H'
export type FilingStatus = 'filed' | 'pending' | 'late_filed'

export interface GSTSummary {
  period: string
  gstOutput: number
  gstInput: number
  itcAvailable: number
  itcUtilized: number
  netPayable: number
  filingStatus: FilingStatus
  filedDate?: string
  dueDate: string
}

export interface HSNEntry {
  hsnCode: string
  description: string
  quantity: number
  taxableValue: number
  gstRate: GSTRate
  gstAmount: number
  total: number
}

export interface TDSEntry {
  section: TDSSection
  payeeName: string
  pan: string
  grossAmount: number
  tdsRate: number
  tdsAmount: number
  period: string
  depositedDate?: string
}

export interface GSTComplianceScore {
  score: number
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  filingAccuracy: number
  timelinessRate: number
  itcMatchRate: number
}
