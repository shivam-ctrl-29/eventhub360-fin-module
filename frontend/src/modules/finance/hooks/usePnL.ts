import { useQuery } from '@tanstack/react-query'
import { reportApi } from '../api/reportApi'
import type { DateRange } from '../types/finance.common.types'

export function useEventPnL(eventId: string) {
  return useQuery({
    queryKey: ['finance', 'pnl', eventId],
    queryFn: () => reportApi.getPnL({ eventId }).then((r) => r.data.data),
    enabled: !!eventId,
  })
}

export function useMonthlyPnL(financialYear: string) {
  return useQuery({
    queryKey: ['finance', 'monthly-pnl', financialYear],
    queryFn: () => reportApi.getMonthlyPnL({ financialYear }).then((r) => r.data.data),
  })
}

export function useAuditTrail(params: {
  page?: number
  limit?: number
  action?: string
  severity?: string
  dateRange?: DateRange
}) {
  return useQuery({
    queryKey: ['finance', 'audit-trail', params],
    queryFn: () => reportApi.getAuditTrail(params).then((r) => r.data.data),
  })
}
