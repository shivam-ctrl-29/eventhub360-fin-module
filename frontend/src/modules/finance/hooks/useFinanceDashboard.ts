import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { dashboardApi } from '../api/dashboardApi'
import { useFinanceUIStore } from '../store/financeUIStore'

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

// Fetches live FX rates from the backend and syncs them into the UI store so
// formatINR() can convert amounts synchronously anywhere in the app. Mount
// once near the app root; React Query handles caching + periodic refetch.
export function useExchangeRatesBootstrap() {
  const setRates = useFinanceUIStore((s) => s.setRates)
  const query = useQuery({
    queryKey: ['finance', 'exchange-rates'],
    queryFn: () => dashboardApi.getExchangeRates().then((r) => r.data.data),
    staleTime: 1000 * 60 * 60, // 1 hour — matches the backend's own cache cadence
    refetchInterval: 1000 * 60 * 60,
  })

  useEffect(() => {
    if (query.data?.rates) {
      setRates(query.data.rates as any, query.data.fetchedAt)
    }
  }, [query.data, setRates])

  return query
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
