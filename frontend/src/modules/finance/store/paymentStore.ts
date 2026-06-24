import { create } from 'zustand'
import type { PaymentStatus } from '../types/payment.types'

interface PaymentUIState {
  statusFilter: PaymentStatus | 'all'
  searchQuery: string
  currentPage: number
  recordPaymentModalOpen: boolean

  setStatusFilter: (s: PaymentStatus | 'all') => void
  setSearchQuery: (q: string) => void
  setCurrentPage: (p: number) => void
  openRecordModal: () => void
  closeRecordModal: () => void
}

export const usePaymentStore = create<PaymentUIState>((set) => ({
  statusFilter: 'all',
  searchQuery: '',
  currentPage: 1,
  recordPaymentModalOpen: false,

  setStatusFilter: (s) => set({ statusFilter: s, currentPage: 1 }),
  setSearchQuery: (q) => set({ searchQuery: q, currentPage: 1 }),
  setCurrentPage: (p) => set({ currentPage: p }),
  openRecordModal: () => set({ recordPaymentModalOpen: true }),
  closeRecordModal: () => set({ recordPaymentModalOpen: false }),
}))
