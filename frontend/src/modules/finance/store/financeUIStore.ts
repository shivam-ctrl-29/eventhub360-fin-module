import { create } from 'zustand'

interface FinanceUIState {
  sidebarCollapsed: boolean
  activeFinancialYear: string
  selectedBranch: string | null

  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setActiveFinancialYear: (fy: string) => void
  setSelectedBranch: (id: string | null) => void
}

export const useFinanceUIStore = create<FinanceUIState>((set) => ({
  sidebarCollapsed: false,
  activeFinancialYear: '2025-26',
  selectedBranch: null,

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveFinancialYear: (fy) => set({ activeFinancialYear: fy }),
  setSelectedBranch: (id) => set({ selectedBranch: id }),
}))
