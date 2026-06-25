import { create } from 'zustand'
import type { InvoiceStatus } from '../types/invoice.types'

interface InvoiceUIState {
  statusFilter: InvoiceStatus | 'all'
  searchQuery: string
  currentPage: number
  pageSize: number
  selectedInvoiceIds: string[]

  setStatusFilter: (status: InvoiceStatus | 'all') => void
  setSearchQuery: (q: string) => void
  setCurrentPage: (p: number) => void
  toggleInvoiceSelection: (id: string) => void
  clearSelection: () => void
}

export const useInvoiceStore = create<InvoiceUIState>((set) => ({
  statusFilter: 'all',
  searchQuery: '',
  currentPage: 1,
  pageSize: 20,
  selectedInvoiceIds: [],

  setStatusFilter: (status) => set({ statusFilter: status, currentPage: 1 }),
  setSearchQuery: (q) => set({ searchQuery: q, currentPage: 1 }),
  setCurrentPage: (p) => set({ currentPage: p }),
  toggleInvoiceSelection: (id) =>
    set((s) => ({
      selectedInvoiceIds: s.selectedInvoiceIds.includes(id)
        ? s.selectedInvoiceIds.filter((x) => x !== id)
        : [...s.selectedInvoiceIds, id],
    })),
  clearSelection: () => set({ selectedInvoiceIds: [] }),
}))
