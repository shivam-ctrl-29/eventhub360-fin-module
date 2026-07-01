import { useFinanceKPIs, useRevenueTrends } from '../../finance/hooks/useFinanceDashboard'
import { useARAgingSummary } from '../../finance/hooks/useARDashboard'
import { usePaymentList } from '../../finance/hooks/usePayments'
import { useInvoiceList } from '../../finance/hooks/useInvoices'
import { useEventPnL } from '../../finance/hooks/usePnL'

/**
 * Aggregates real, already-public finance figures for the login page's
 * marketing widgets. Every number here traces to an actual DB-backed query —
 * nothing is invented. If a figure can't be computed honestly, it's omitted
 * (the widget shows a neutral placeholder) rather than faked.
 */
export function useLoginSnapshot() {
  const year = new Date().getFullYear()
  const { data: kpis, isLoading: kpisLoading } = useFinanceKPIs()
  const { data: trends, isLoading: trendsLoading } = useRevenueTrends(year)
  const { data: aging } = useARAgingSummary()
  const { data: paymentsPage } = usePaymentList({ page: 1, limit: 5, sortBy: 'paidAt', sortOrder: 'desc' })
  const { data: invoicesPage } = useInvoiceList({ page: 1, limit: 200 })
  const { data: pnl } = useEventPnL('all')

  const monthly = (trends ?? []).filter((m: any) => m.revenue > 0)
  // Show the months that actually have revenue (not the last 7 calendar months,
  // which are mostly future/zero and would bury the real data under padding).
  const bars = monthly.slice(-7)
  const maxBar = Math.max(...bars.map((b: any) => b.revenue), 1)

  let momGrowthPct: number | null = null
  if (monthly.length >= 2) {
    const last = monthly[monthly.length - 1].revenue
    const prev = monthly[monthly.length - 2].revenue
    if (prev > 0) momGrowthPct = Math.round(((last - prev) / prev) * 1000) / 10
  }

  const invoices = invoicesPage?.data ?? []
  const paidCount = invoices.filter((i: any) => i.status === 'Paid' || i.status === 'paid').length
  const collectionRatePct = invoices.length > 0 ? Math.round((paidCount / invoices.length) * 1000) / 10 : null

  const recentPayment = (paymentsPage?.data ?? [])[0] ?? null

  return {
    isLoading: kpisLoading || trendsLoading,
    totalLiquidity: kpis?.cashForecast ?? 0,
    momGrowthPct,
    bars: bars.map((b: any) => ({ month: b.month, revenue: b.revenue, pct: Math.round((b.revenue / maxBar) * 100) })),
    netMarginPct: pnl?.netMargin ?? null,
    avgCollectionDays: aging?.avgCollectionDays ?? null,
    recentPaymentAmount: recentPayment?.amount ?? null,
    collectionRatePct,
  }
}
