import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { BellOutlined, CalendarOutlined, MoreOutlined } from '@ant-design/icons'
import { Skeleton } from 'antd'
import { useFinanceKPIs, useRevenueTrends, useBranchPerformance } from '../../hooks/useFinanceDashboard'
import { formatINR } from '../../utils/currencyFormatter'

const HEATMAP_COLS = ['0-15D', '15-30D', '30-45D', '45-60D', '60-90D', '90-120D', '120+D']
const heatIntensity = (v: number) => {
  const colors = ['#F5F0EB', '#F5C6C6', '#EE9999', '#E06666', '#CC3333', '#8B1A1A']
  return colors[Math.min(v, 5)]
}

const KPI_META = [
  { key: 'totalRevenue',  label: 'TOTAL REVENUE', icon: '💰', iconBg: '#FEF3C7', deltaType: 'positive', deltaLabel: 'This FY'       },
  { key: 'receivables',   label: 'RECEIVABLES',   icon: '📋', iconBg: '#FEE2E2', deltaType: 'negative', deltaLabel: 'Overdue'        },
  { key: 'payables',      label: 'PAYABLE',        icon: '🧾', iconBg: '#F1F5F9', deltaType: 'warning',  deltaLabel: 'Pending Bills'  },
  { key: 'eventMargin',   label: 'EVENT MARGIN',   icon: '📈', iconBg: '#FEF3C7', deltaType: 'positive', deltaLabel: 'Gross Margin'   },
  { key: 'taxLiability',  label: 'TAXES',          icon: '🏛️', iconBg: '#F1F5F9', deltaType: 'warning',  deltaLabel: 'GST Accrued'   },
  { key: 'cashForecast',  label: 'CASH FORECAST',  icon: '🏦', iconBg: '#D1FAE5', deltaType: 'positive', deltaLabel: 'Healthy'        },
] as const

// ── Component ─────────────────────────────────────────────────────────
export default function FinanceDashboard() {
  const [revenueTab, setRevenueTab] = useState<'Revenue' | 'Expenses'>('Revenue')
  const currentYear = new Date().getFullYear()

  const { data: kpis, isLoading: kpisLoading } = useFinanceKPIs()
  const { data: revenueTrends, isLoading: trendsLoading } = useRevenueTrends(currentYear)
  const { data: branches, isLoading: branchesLoading } = useBranchPerformance()

  const expenseData = [
    { name: 'Venue & Ops', value: 54, color: '#8B1A1A' },
    { name: 'Marketing',   value: 28, color: '#C4A24D' },
    { name: 'Payroll',     value: 18, color: '#E2C4C4' },
  ]

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Executive CFO Cockpit</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Real-time fiscal oversight and event profitability metrics.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff', border: '1px solid #E8E0D8',
            borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#334155',
          }}>
            <CalendarOutlined style={{ color: '#8B1A1A' }} /> Q4 FY2024
          </div>
          <div style={{
            width: 34, height: 34, background: '#fff', border: '1px solid #E8E0D8',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <BellOutlined style={{ fontSize: 15, color: '#64748b' }} />
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {kpisLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #E8E0D8' }}>
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </div>
            ))
          : KPI_META.map((k) => {
              const raw = kpis ? kpis[k.key] : 0
              const isPercent = k.key === 'eventMargin'
              const display = isPercent ? `${raw.toFixed(1)}%` : formatINR(raw, { compact: true })
              return (
                <div key={k.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 12px', border: '1px solid #E8E0D8' }}>
                  <div style={{ width: 32, height: 32, background: k.iconBg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginBottom: 10 }}>
                    {k.icon}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 4 }}>
                    {k.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2a4a', lineHeight: 1.2 }}>
                    {display}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 5, fontWeight: 500, color: k.deltaType === 'positive' ? '#059669' : k.deltaType === 'negative' ? '#DC2626' : '#C4A24D' }}>
                    {k.deltaType === 'positive' ? '↑' : k.deltaType === 'negative' ? '↓' : '⏱'} {k.deltaLabel}
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 20 }}>

        {/* Revenue Trends */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>Revenue Trends</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Monthly comparison vs Previous Year</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['Revenue', 'Expenses'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRevenueTab(tab)}
                  style={{
                    padding: '4px 12px', borderRadius: 6, border: 'none',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
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
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [`$${v}K`]}
                contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D8', fontSize: 11 }}
              />
              <Bar
                dataKey={revenueTab === 'Revenue' ? 'revenue' : 'expenses'}
                fill={revenueTab === 'Revenue' ? '#8B1A1A' : '#C4A24D'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Distribution */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a', marginBottom: 4 }}>Expense Distribution</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {expenseData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8 }}>
            {expenseData.map((e) => (
              <div key={e.name} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#334155' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
                  {e.name}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1a2a4a' }}>{e.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Invoice Aging Heatmap — visual indicator, data comes from AR aging report */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>Invoice Aging Heatmap</div>
            <MoreOutlined style={{ color: '#94a3b8', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${HEATMAP_COLS.length}, 1fr)`, gap: 3, marginBottom: 6 }}>
            {HEATMAP_COLS.map((col) => (
              <div key={col} style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>{col}</div>
            ))}
          </div>
          {[[1,2,3,4,2,1,0],[0,1,2,5,3,2,1],[1,1,1,2,1,0,0],[0,2,4,3,2,1,0]].map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${HEATMAP_COLS.length}, 1fr)`, gap: 3, marginBottom: 3 }}>
              {row.map((val, ci) => (
                <div key={ci} style={{ height: 22, borderRadius: 4, background: heatIntensity(val), border: '1px solid rgba(0,0,0,0.04)' }} />
              ))}
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, fontStyle: 'italic' }}>
            See AR Aging Report for full breakdown.
          </div>
        </div>

        {/* Branch Performance */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a', marginBottom: 14 }}>Branch Performance</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 70px 28px',
            gap: 8, marginBottom: 10,
          }}>
            {['BRANCH NAME', 'REVENUE', 'GROWTH', ''].map((h) => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
            ))}
          </div>
          {branchesLoading
            ? <Skeleton active paragraph={{ rows: 3 }} />
            : (branches ?? []).map((b) => (
              <div key={b.branchId} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 28px', gap: 8, alignItems: 'center', padding: '12px 0', borderTop: '1px solid #F5F0EB' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>{b.branchName}</div>
                <div style={{ fontSize: 13, color: '#334155' }}>{formatINR(b.revenue ?? 0, { compact: true })}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                  —
                </div>
                <div style={{ width: 24, height: 3, borderRadius: 2, background: '#C4A24D' }} />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
