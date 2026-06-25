import { useQuery } from '@tanstack/react-query'
import { reportApi } from '../api/reportApi'
import type { TableParams } from '../types/finance.common.types'

export function useGSTSummary(financialYear: string) {
  return useQuery({
    queryKey: ['finance', 'gst-summary', financialYear],
    queryFn: () => reportApi.getGSTSummary({ financialYear }).then((r) => r.data.data),
  })
}

export function useGSTComplianceScore() {
  return useQuery({
    queryKey: ['finance', 'gst-compliance-score'],
    queryFn: () => reportApi.getGSTComplianceScore().then((r) => r.data.data),
  })
}

export function useHSNBreakdown(params: TableParams & { period: string }) {
  return useQuery({
    queryKey: ['finance', 'hsn', params],
    queryFn: () => reportApi.getHSNBreakdown(params).then((r) => r.data.data),
  })
}
