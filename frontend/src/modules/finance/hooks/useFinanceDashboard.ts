import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboardApi'

export function useFinanceKPIs() {
  return useQuery({
    queryKey: ['finance', 'kpis'],
    queryFn: () => dashboardApi.getKPIs().then((r) => r.data.data),
  })
}

export function useRevenueTrends(year: number) {
  return useQuery({
    queryKey: ['finance', 'revenue-trends', year],
    queryFn: () => dashboardApi.getRevenueTrends({ year }).then((r) => r.data.data),
  })
}

export function useCompany() {
  return useQuery({
    queryKey: ['finance', 'company'],
    queryFn: () => dashboardApi.getCompany().then((r) => r.data.data),
    staleTime: 1000 * 60 * 30,
  })
}

export function useExpenseDistribution() {
  return useQuery({
    queryKey: ['finance', 'expense-distribution'],
    queryFn: () => dashboardApi.getExpenseDistribution().then((r) => r.data.data),
  })
}

export function useBranchPerformance() {
  return useQuery({
    queryKey: ['finance', 'branch-performance'],
    queryFn: () => dashboardApi.getBranchPerformance().then((r) => r.data.data),
  })
}

export function useCashHealth() {
  return useQuery({
    queryKey: ['finance', 'cash-health'],
    queryFn: () => dashboardApi.getCashHealth().then((r) => r.data.data),
  })
}
