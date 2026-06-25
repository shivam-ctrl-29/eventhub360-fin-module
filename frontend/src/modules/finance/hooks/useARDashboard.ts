import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { receivableApi } from '../api/receivableApi'
import type { TableParams } from '../types/finance.common.types'

export function useARAgingSummary() {
  return useQuery({
    queryKey: ['finance', 'ar-aging-summary'],
    queryFn: () => receivableApi.getARAgingSummary().then((r) => r.data.data),
  })
}

export function useARAgingEntries(params: TableParams) {
  return useQuery({
    queryKey: ['finance', 'ar-aging', params],
    queryFn: () => receivableApi.getARAgingEntries(params).then((r) => r.data.data),
  })
}

export function useDunningQueue(params: TableParams) {
  return useQuery({
    queryKey: ['finance', 'dunning', params],
    queryFn: () => receivableApi.getDunningQueue(params).then((r) => r.data.data),
  })
}

export function useSendReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, level }: { customerId: string; level: string }) =>
      receivableApi.sendReminder(customerId, level).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'dunning'] }) },
  })
}
