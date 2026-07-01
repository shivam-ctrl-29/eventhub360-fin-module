import { create } from 'zustand'

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'KWD'

// Live FX rates (units of that currency per 1 INR), fetched from the backend.
// `null` until the first successful fetch — callers must not invent a rate.
export type ExchangeRates = Partial<Record<Exclude<CurrencyCode, 'INR'>, number>>

interface FinanceUIState {
  sidebarCollapsed: boolean
  currency: CurrencyCode
  activeFinancialYear: string
  selectedBranch: string | null
  rates: ExchangeRates | null
  ratesFetchedAt: string | null

  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setCurrency: (c: CurrencyCode) => void
  setActiveFinancialYear: (fy: string) => void
  setSelectedBranch: (id: string | null) => void
  setRates: (rates: ExchangeRates, fetchedAt: string) => void
}

const savedCurrency = (typeof localStorage !== 'undefined' && localStorage.getItem('fin_currency')) as CurrencyCode | null

export const useFinanceUIStore = create<FinanceUIState>((set) => ({
  sidebarCollapsed: false,
  currency: savedCurrency ?? 'INR',
  activeFinancialYear: '2025-26',
  selectedBranch: null,
  rates: null,
  ratesFetchedAt: null,

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCurrency: (c) => { try { localStorage.setItem('fin_currency', c) } catch { /* ignore */ } set({ currency: c }) },
  setActiveFinancialYear: (fy) => set({ activeFinancialYear: fy }),
  setSelectedBranch: (id) => set({ selectedBranch: id }),
  setRates: (rates, fetchedAt) => set({ rates, ratesFetchedAt: fetchedAt }),
}))
