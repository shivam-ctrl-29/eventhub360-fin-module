import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reconciliationApi } from '../api/reconciliationApi'
import type { TableParams } from '../types/finance.common.types'

export function useReconciliationEntries(params: TableParams & { reconciled?: boolean }) {
  return useQuery({
    queryKey: ['finance', 'reconciliation', params],
    queryFn: () => reconciliationApi.list(params).then((r) => r.data.data),
  })
}

export function useMatchEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, invoiceId }: { entryId: string; invoiceId: string }) =>
      reconciliationApi.match(entryId, invoiceId).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'reconciliation'] }) },
  })
}
