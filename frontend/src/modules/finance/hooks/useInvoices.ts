import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceApi, type InvoiceFilters } from '../api/invoiceApi'
import type { CreateInvoicePayload } from '../types/invoice.types'

export function useInvoiceList(filters: InvoiceFilters) {
  return useQuery({
    queryKey: ['finance', 'invoices', filters],
    queryFn: () => invoiceApi.list(filters).then((r) => r.data.data),
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['finance', 'invoice', id],
    queryFn: () => invoiceApi.get(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoiceApi.create(payload).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'invoices'] }) },
  })
}

export function useUpdateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateInvoicePayload> }) =>
      invoiceApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoice', id] })
    },
  })
}

export function useSendInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoiceApi.send(id).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'invoices'] }) },
  })
}
