import { create } from 'zustand'

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'KWD'

interface FinanceUIState {
  sidebarCollapsed: boolean
  currency: CurrencyCode
  activeFinancialYear: string
  selectedBranch: string | null

  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setCurrency: (c: CurrencyCode) => void
  setActiveFinancialYear: (fy: string) => void
  setSelectedBranch: (id: string | null) => void
}

const savedCurrency = (typeof localStorage !== 'undefined' && localStorage.getItem('fin_currency')) as CurrencyCode | null

export const useFinanceUIStore = create<FinanceUIState>((set) => ({
  sidebarCollapsed: false,
  currency: savedCurrency ?? 'INR',
  activeFinancialYear: '2025-26',
  selectedBranch: null,

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCurrency: (c) => { try { localStorage.setItem('fin_currency', c) } catch { /* ignore */ } set({ currency: c }) },
  setActiveFinancialYear: (fy) => set({ activeFinancialYear: fy }),
  setSelectedBranch: (id) => set({ selectedBranch: id }),
}))
