import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseApi } from '../api/expenseApi'
import type { TableParams } from '../types/finance.common.types'

export function useExpenseList(params: TableParams & { status?: string; category?: string }) {
  return useQuery({
    queryKey: ['finance', 'expenses', params],
    queryFn: () => expenseApi.list(params).then((r) => r.data.data),
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { category: string; description: string; amount: number; submittedDate: string }) =>
      expenseApi.create(payload).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'expenses'] }) },
  })
}

export function useApproveExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expenseApi.approve(id).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'expenses'] }) },
  })
}

export function useRejectExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      expenseApi.reject(id, reason).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'expenses'] }) },
  })
}
