import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentApi, type RecordPaymentPayload } from '../api/paymentApi'
import type { TableParams } from '../types/finance.common.types'

export function usePaymentList(params: TableParams) {
  return useQuery({
    queryKey: ['finance', 'payments', params],
    queryFn: () => paymentApi.list(params).then((r) => r.data.data),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RecordPaymentPayload) => paymentApi.record(payload).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'payments'] }) },
  })
}

export function useReceipt(paymentId: string) {
  return useQuery({
    queryKey: ['finance', 'receipt', paymentId],
    queryFn: () => paymentApi.getReceipt(paymentId).then((r) => r.data.data),
    enabled: !!paymentId,
  })
}
