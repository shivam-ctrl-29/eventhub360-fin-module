import axiosInstance from '@shared/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, TableParams, DateRange } from '../types/finance.common.types'
import type { GSTSummary, HSNEntry, TDSEntry, GSTComplianceScore } from '../types/gst.types'
import type { EventPnL, MonthlyPnL } from '../types/pnl.types'

export const reportApi = {
  getGSTSummary: (params: { financialYear: string }) =>
    axiosInstance.get<ApiResponse<GSTSummary[]>>('/api/fin/reports/gst', { params }),

  getGSTComplianceScore: () =>
    axiosInstance.get<ApiResponse<GSTComplianceScore>>('/api/fin/reports/gst/compliance-score'),

  getHSNBreakdown: (params: TableParams & { period: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<HSNEntry>>>('/api/fin/reports/gst/hsn', { params }),

  getTDSEntries: (params: TableParams & { period: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<TDSEntry>>>('/api/fin/reports/tds', { params }),

  getPnL: (params: { eventId?: string; dateRange?: DateRange }) =>
    axiosInstance.get<ApiResponse<EventPnL>>('/api/fin/reports/pnl', { params }),

  getMonthlyPnL: (params: { financialYear: string }) =>
    axiosInstance.get<ApiResponse<MonthlyPnL[]>>('/api/fin/reports/pnl/monthly', { params }),

  getAuditTrail: (params: TableParams & { action?: string; severity?: string; dateRange?: DateRange }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<AuditEntry>>>('/api/fin/reports/audit', { params }),
}

export interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
  entity: string
  entityId: string
  description: string
  severity: 'info' | 'success' | 'warning' | 'error'
  ipAddress?: string
}
