import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payableApi } from '../api/payableApi'
import type { TableParams } from '../types/finance.common.types'

export function useAPAgingSummary() {
  return useQuery({
    queryKey: ['finance', 'ap-aging-summary'],
    queryFn: () => payableApi.getAPAgingSummary().then((r) => r.data.data),
  })
}

export function useVendorBills(params: TableParams & { status?: string }) {
  return useQuery({
    queryKey: ['finance', 'vendor-bills', params],
    queryFn: () => payableApi.getBills(params).then((r) => r.data.data),
  })
}

export function usePayoutSchedule(params: TableParams) {
  return useQuery({
    queryKey: ['finance', 'payout-schedule', params],
    queryFn: () => payableApi.getPayoutSchedule(params).then((r) => r.data.data),
  })
}

export function useApprovePayouts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => payableApi.approvePayouts(ids).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'payout-schedule'] }) },
  })
}

export function useDisburse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => payableApi.disburse(ids).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'payout-schedule'] }) },
  })
}
