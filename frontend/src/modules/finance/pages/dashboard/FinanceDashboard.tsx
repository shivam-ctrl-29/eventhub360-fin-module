import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { BellOutlined, CalendarOutlined } from '@ant-design/icons'
import { Skeleton, Badge, Dropdown } from 'antd'
import { useFinanceKPIs, useRevenueTrends, useBranchPerformance, useExpenseDistribution } from '../../hooks/useFinanceDashboard'
import { useARAgingSummary } from '../../hooks/useARDashboard'
import { useExpenseList } from '../../hooks/useExpenses'
import { usePayoutSchedule } from '../../hooks/useAPDashboard'
import { formatINR } from '../../utils/currencyFormatter'

const PIE_COLORS = ['#8B1A1A', '#C4A24D', '#1a2a4a', '#E2946B', '#059669', '#CC5555', '#94a3b8']

/** Eases a number from 0 to its real value on first render (skipped for reduced-motion users). */
function useCountUp(target: number, duration = 700) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    // rAF doesn't fire in hidden tabs — show the real value immediately there,
    // and as a hard guarantee settle on it when the animation window ends.
    if (
      !Number.isFinite(target) || target === 0 || document.hidden ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVal(target)
      return
    }
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setVal(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const settle = window.setTimeout(() => setVal(target), duration + 100)
    return () => { cancelAnimationFrame(raf); window.clearTimeout(settle) }
  }, [target, duration])
  return val
}

function KpiValue({ raw, isPercent }: { raw: number; isPercent: boolean }) {
  const animated = useCountUp(raw)
  return <>{isPercent ? `${animated.toFixed(1)}%` : formatINR(animated, { compact: true })}</>
}

// Current financial year + quarter label (India FY: Apr–Mar)
function currentFYLabel() {
  const now = new Date()
  const m = now.getMonth() // 0-11
  const y = now.getFullYear()
  const fyStart = m >= 3 ? y : y - 1
  const q = m >= 3 && m <= 5 ? 'Q1' : m >= 6 && m <= 8 ? 'Q2' : m >= 9 && m <= 11 ? 'Q3' : 'Q4'
  return `${q} FY${fyStart}-${String(fyStart + 1).slice(2)}`
}

const NEUTRAL = '#94a3b8', POS = '#059669', NEG = '#DC2626'

// Each KPI's caption is derived from the real value, not a fixed sentiment.
const KPI_META = [
  { key: 'totalRevenue', label: 'TOTAL REVENUE', icon: '💰', iconBg: '#FEF3C7',
    caption: () => ({ text: 'Invoiced this FY', color: NEUTRAL }) },
  { key: 'receivables', label: 'RECEIVABLES', icon: '📋', iconBg: '#FEE2E2',
    caption: (v: number) => ({ text: v > 0 ? 'Awaiting collection' : 'All collected', color: v > 0 ? NEG : POS }) },
  { key: 'payables', label: 'PAYABLE', icon: '🧾', iconBg: '#F1F5F9',
    caption: (v: number) => ({ text: v > 0 ? 'Scheduled payouts' : 'Nothing due', color: v > 0 ? '#C4A24D' : POS }) },
  { key: 'eventMargin', label: 'EVENT MARGIN', icon: '📈', iconBg: '#FEF3C7',
    caption: (v: number) => ({ text: v >= 0 ? 'Profitable' : 'Loss-making', color: v >= 0 ? POS : NEG }) },
  { key: 'taxLiability', label: 'TAXES', icon: '🏛️', iconBg: '#F1F5F9',
    caption: () => ({ text: 'GST on sales', color: NEUTRAL }) },
  { key: 'cashForecast', label: 'CASH FORECAST', icon: '🏦', iconBg: '#D1FAE5',
    caption: (v: number) => ({ text: v >= 0 ? 'Positive position' : 'Negative position', color: v >= 0 ? POS : NEG }) },
] as const

// ── Component ─────────────────────────────────────────────────────────
export default function FinanceDashboard() {
  const navigate = useNavigate()
  const [revenueTab, setRevenueTab] = useState<'Revenue' | 'Expenses'>('Revenue')
  const currentYear = new Date().getFullYear()

  const { data: kpis, isLoading: kpisLoading, isError: kpisError, refetch: refetchKpis, isFetching: kpisFetching } = useFinanceKPIs()
  const { data: revenueTrends, isLoading: trendsLoading } = useRevenueTrends(currentYear)
  const { data: branches, isLoading: branchesLoading } = useBranchPerformance()
  const { data: expenseDist, isLoading: expenseLoading } = useExpenseDistribution()
  const { data: agingSummary } = useARAgingSummary()
  const { data: pendingExpenses } = useExpenseList({ page: 1, limit: 100, status: 'pending' })
  const { data: payouts } = usePayoutSchedule({ page: 1, limit: 100 })

  const expenseData = (expenseDist ?? []).map((e, i) => ({
    name: e.category, value: e.pct, amount: e.amount, color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  // Real, data-driven notifications for the bell
  const pendingExpenseCount = pendingExpenses?.total ?? 0
  const scheduledPayoutCount = (payouts?.data ?? []).filter((p: any) => p.status === 'scheduled').length
  const alerts: Array<{ text: string; to: string }> = []
  if ((kpis?.receivables ?? 0) > 0) alerts.push({ text: `${formatINR(kpis!.receivables, { compact: true })} in receivables outstanding`, to: '/finance/ar-aging' })
  if (pendingExpenseCount > 0) alerts.push({ text: `${pendingExpenseCount} expense${pendingExpenseCount > 1 ? 's' : ''} awaiting approval`, to: '/finance/expenses' })
  if (scheduledPayoutCount > 0) alerts.push({ text: `${scheduledPayoutCount} vendor payout${scheduledPayoutCount > 1 ? 's' : ''} scheduled`, to: '/finance/payouts' })

  const bellMenu = {
    items: alerts.length
      ? alerts.map((a, i) => ({ key: String(i), label: a.text, onClick: () => navigate(a.to) }))
      : [{ key: 'none', label: 'No new alerts', disabled: true }],
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Executive CFO Cockpit</div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>Real-time fiscal oversight and event profitability metrics.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff', border: '1px solid #E8E0D8',
            borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#334155',
          }}>
            <CalendarOutlined style={{ color: '#8B1A1A' }} /> {currentFYLabel()}
          </div>
          <Dropdown menu={bellMenu} trigger={['click']} placement="bottomRight">
            <Badge count={alerts.length} size="small" offset={[-4, 4]}>
              <div style={{
                width: 34, height: 34, background: '#fff', border: '1px solid #E8E0D8',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <BellOutlined style={{ fontSize: 15, color: '#64748b' }} />
              </div>
            </Badge>
          </Dropdown>
        </div>
      </div>

      {/* ── Error banner — real failures show up here instead of silently rendering ₹0.00 everywhere ── */}
      {kpisError && (
        <div className="eh-pop" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10,
          padding: '12px 16px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, color: '#991B1B' }}>
            <strong>Couldn't load live data.</strong> The backend may be waking up from idle (free-tier hosting sleeps after ~15 min) — this can take up to a minute on the first try.
          </div>
          <button
            onClick={() => refetchKpis()}
            disabled={kpisFetching}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 8, border: 'none',
              background: '#8B1A1A', color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: kpisFetching ? 'not-allowed' : 'pointer', opacity: kpisFetching ? 0.6 : 1,
            }}
          >
            {kpisFetching ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="eh-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {kpisLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #E8E0D8' }}>
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </div>
            ))
          : kpisError
            ? null
            : KPI_META.map((k) => {
              const raw = kpis ? kpis[k.key] : 0
              const isPercent = k.key === 'eventMargin'
              const cap = k.caption(raw)
              return (
                <div key={k.label} className="eh-lift" style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #E8E0D8' }}>
                  <div style={{ width: 32, height: 32, background: k.iconBg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginBottom: 10 }}>
                    {k.icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 4 }}>
                    {k.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2a4a', lineHeight: 1.2 }}>
                    <KpiValue raw={raw} isPercent={isPercent} />
                  </div>
                  <div style={{ fontSize: 12, marginTop: 5, fontWeight: 500, color: cap.color }}>
                    {cap.text}
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* ── Charts Row ── */}
      <div className="eh-reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 20, alignItems: 'start' }}>

        {/* Revenue Trends */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>{revenueTab} Trends</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Monthly {revenueTab.toLowerCase()} · FY {currentYear}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['Revenue', 'Expenses'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRevenueTab(tab)}
                  style={{
                    padding: '4px 12px', borderRadius: 6, border: 'none',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: revenueTab === tab ? '#8B1A1A' : '#F5F0EB',
                    color: revenueTab === tab ? '#fff' : '#64748b',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {trendsLoading
            ? <Skeleton active paragraph={{ rows: 4 }} />
            : null}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueTrends ?? []} barSize={18}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [formatINR(v, { compact: true }), revenueTab]}
                contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D8', fontSize: 12 }}
              />
              <Bar
                dataKey={revenueTab === 'Revenue' ? 'revenue' : 'expenses'}
                fill={revenueTab === 'Revenue' ? '#8B1A1A' : '#C4A24D'}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Distribution */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 4 }}>Expense Distribution</div>
          {expenseLoading
            ? <Skeleton active paragraph={{ rows: 3 }} />
            : expenseData.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>No expense data yet</div>
              : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={expenseData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={2} dataKey="value" isAnimationActive={false}>
                    {expenseData.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(_v: number, _n, p: any) => [formatINR(p.payload.amount), p.payload.name]} contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D8', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8 }}>
                {expenseData.map((e) => (
                  <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
                      {e.name}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a2a4a' }}>{e.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="eh-reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Invoice Aging — real AR aging buckets from the DB */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Invoice Aging</div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Total {formatINR((agingSummary?.buckets ?? []).reduce((s, b) => s + b.amount, 0), { compact: true })}</span>
          </div>
          {(() => {
            const buckets = agingSummary?.buckets ?? []
            const max = Math.max(...buckets.map((b) => b.amount), 1)
            const colors = ['#F5C6C6', '#EE9999', '#E06666', '#CC3333', '#8B1A1A']
            if (buckets.length === 0) return <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: 13 }}>No outstanding invoices</div>
            return buckets.map((b, i) => (
              <div key={b.bucket} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#334155' }}>{b.bucket}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(b.amount, { compact: true })}</span>
                </div>
                <div style={{ height: 10, background: '#F5F0EB', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((b.amount / max) * 100)}%`, background: colors[i % colors.length], borderRadius: 5 }} />
                </div>
              </div>
            ))
          })()}
        </div>

        {/* Branch Performance */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 14 }}>Branch Performance</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 90px 70px 60px',
            gap: 8, marginBottom: 10,
          }}>
            {['BRANCH NAME', 'REVENUE', 'INVOICES', 'SHARE'].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
            ))}
          </div>
          {branchesLoading
            ? <Skeleton active paragraph={{ rows: 3 }} />
            : (branches ?? []).length === 0
              ? <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>No branch data</div>
              : (branches ?? []).map((b: any) => (
              <div key={b.branchId} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 60px', gap: 8, alignItems: 'center', padding: '12px 0', borderTop: '1px solid #F5F0EB' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>{b.branchName}</div>
                <div style={{ fontSize: 14, color: '#334155' }}>{formatINR(b.revenue ?? 0, { compact: true })}</div>
                <div style={{ fontSize: 14, color: '#334155' }}>{b.events ?? 0}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#8B1A1A' }}>{b.sharePct ?? 0}%</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
