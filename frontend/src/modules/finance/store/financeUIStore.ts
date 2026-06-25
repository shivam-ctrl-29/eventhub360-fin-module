import { create } from 'zustand'

interface FinanceUIState {
  sidebarCollapsed: boolean
  copilotOpen: boolean
  activeFinancialYear: string
  selectedBranch: string | null

  setSidebarCollapsed: (v: boolean) => void
  setCopilotOpen: (v: boolean) => void
  setActiveFinancialYear: (fy: string) => void
  setSelectedBranch: (id: string | null) => void
}

export const useFinanceUIStore = create<FinanceUIState>((set) => ({
  sidebarCollapsed: false,
  copilotOpen: true,
  activeFinancialYear: '2024-25',
  selectedBranch: null,

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setCopilotOpen: (v) => set({ copilotOpen: v }),
  setActiveFinancialYear: (fy) => set({ activeFinancialYear: fy }),
  setSelectedBranch: (id) => set({ selectedBranch: id }),
}))
