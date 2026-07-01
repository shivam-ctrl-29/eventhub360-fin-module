import { useState } from 'react'
import { message } from '@shared/lib/antdStatic'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { DownloadOutlined, SettingOutlined } from '@ant-design/icons'
import { Skeleton, Alert } from 'antd'
import { useEventPnL } from '../../hooks/usePnL'
import { formatINR } from '../../utils/currencyFormatter'
import { downloadCSV } from '../../utils/exportHelper'
import dayjs from 'dayjs'

const PIE_COLORS = ['#8B1A1A', '#C4A24D', '#94a3b8', '#E2946B']

const DUMMY_EVENT_ID = 'current'

export default function ProfitLossReport() {
  const [allocationTab, setAllocationTab] = useState<'Actual' | 'Projected'>('Actual')

  const { data: pnl, isLoading, isError } = useEventPnL(DUMMY_EVENT_ID)

  const lineItems = pnl?.lineItems ?? []
  const categoryTotals = lineItems.reduce<Record<string, number>>((acc, item) => {
    const cat = item.category ?? 'Other'
    acc[cat] = (acc[cat] ?? 0) + ((item as any).actual ?? (item as any).amount ?? 0)
    return acc
  }, {})
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }))
  const totalCosts = pnl?.totalExpenses ?? 0

  const exportPnL = () => {
    if (!pnl) { message.info('No P&L data to export'); return }
    downloadCSV('event-pnl', [{
      event: pnl.eventName,
      revenue: pnl.totalRevenue,
      expenses: pnl.totalExpenses,
      netProfit: pnl.netProfit,
      netMargin: `${pnl.netMargin}%`,
    }])
    message.success('P&L exported')
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
        <span>Financials</span><span style={{ margin: '0 6px' }}>›</span><span style={{ color: '#334155' }}>Event P&L</span>
      </div>

      {isError && <Alert type="error" message="Failed to load P&L data." style={{ marginBottom: 16 }} />}

      <div style={{ marginBottom: 24 }}>
        {isLoading
          ? <Skeleton active paragraph={{ rows: 2 }} />
          : (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a2a4a', lineHeight: 1.2, marginBottom: 12 }}>
                {pnl?.eventName ?? 'Event P&L Report'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {pnl?.eventDate && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', background: '#fff', border: '1px solid #E8E0D8', borderRadius: 6, padding: '5px 10px' }}>
                    📅 {dayjs(pnl.eventDate).format('MMM DD, YYYY')}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', background: '#F5F0EB', borderRadius: 6, padding: '5px 10px', fontWeight: 600 }}>
                  {(pnl?.lineItems?.length ?? 0)} cost line{(pnl?.lineItems?.length ?? 0) === 1 ? '' : 's'}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button onClick={exportPnL} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    <DownloadOutlined style={{ fontSize: 13 }} /> Export P&L
                  </button>
                  <button onClick={() => message.info('Adjustments require finance-manager approval — coming in the next sprint')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#8B1A1A', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                    <SettingOutlined style={{ fontSize: 13 }} /> Manage Adjustments
                  </button>
                </div>
              </div>
            </>
          )
        }

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ background: '#fff', border: '1px solid #E8E0D8', borderRadius: 12, padding: '16px 18px' }}><Skeleton active paragraph={{ rows: 2 }} title={false} /></div>)
            : [
                { label: 'GROSS REVENUE',  value: formatINR(pnl?.totalRevenue ?? 0),  delta: '',        deltaColor: '#059669', bg: '#fff', valueColor: '#1a2a4a' },
                { label: 'TOTAL EXPENSES', value: formatINR(pnl?.totalExpenses ?? 0), delta: '',        deltaColor: '#C4A24D', bg: '#fff', valueColor: '#1a2a4a' },
                { label: 'NET PROFIT',     value: formatINR(pnl?.netProfit ?? 0),     delta: 'Realized', deltaColor: '#8B1A1A', bg: '#fff', valueColor: '#8B1A1A' },
                { label: 'PROFIT MARGIN',  value: `${pnl ? pnl.netMargin.toFixed(1) : '0'}%`, delta: 'Net margin this period', deltaColor: '#94a3b8', bg: '#fff', valueColor: '#1a2a4a' },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, border: '1px solid #E8E0D8', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 8 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: k.valueColor, lineHeight: 1.1, marginBottom: 6 }}>{k.value}</div>
                  <div style={{ fontSize: 12, color: k.deltaColor, fontWeight: 500 }}>{k.delta}</div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Category Allocation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Category Allocation</div>
            <div style={{ display: 'flex', background: '#F5F0EB', borderRadius: 8, padding: 3 }}>
              {(['Actual', 'Projected'] as const).map((t) => (
                <button key={t} onClick={() => setAllocationTab(t)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: allocationTab === t ? '#fff' : 'transparent', color: allocationTab === t ? '#1a2a4a' : '#94a3b8' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {isLoading
            ? <Skeleton active paragraph={{ rows: 4 }} />
            : pieData.length > 0
              ? (
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [formatINR(v, { compact: true })]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>COSTS</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1a2a4a' }}>{formatINR(totalCosts, { compact: true })}</div>
                    </div>
                  </div>
                  <div>
                    {pieData.map((c, i) => (
                      <div key={c.name} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#334155' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block', flexShrink: 0 }} />
                            {c.name}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(c.value, { compact: true })}</span>
                        </div>
                        <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${totalCosts > 0 ? Math.round((c.value / totalCosts) * 100) : 0}%`, background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
              : <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 14 }}>No line items available</div>
          }
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 8 }}>Profit Breakdown</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 16 }}>
            Revenue, costs and net profit for this view.
          </div>
          {(() => {
            const rev = pnl?.totalRevenue ?? 0
            const cost = totalCosts
            const net = pnl?.netProfit ?? 0
            const max = Math.max(rev, cost, Math.abs(net), 1)
            const bars = [
              { label: 'Revenue', value: rev, color: '#8B1A1A' },
              { label: 'Costs', value: cost, color: '#C4A24D' },
              { label: 'Net Profit', value: net, color: '#059669' },
            ]
            return bars.map((b) => (
              <div key={b.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#334155' }}>{b.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(b.value, { compact: true })}</span>
                </div>
                <div style={{ height: 9, background: '#F1F5F9', borderRadius: 5 }}>
                  <div style={{ height: '100%', width: `${Math.round((Math.abs(b.value) / max) * 100)}%`, background: b.color, borderRadius: 5 }} />
                </div>
              </div>
            ))
          })()}
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid #F5F0EB', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Net Margin</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#8B1A1A' }}>{(pnl?.netMargin ?? 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Financial Ledger */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 10px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Financial Ledger</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px', padding: '8px 20px', background: '#1a2a4a' }}>
          {['DESCRIPTION', 'CATEGORY', 'AMOUNT'].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>
        {isLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 5 }} /></div>}
        {!isLoading && lineItems.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>No line items available</div>
        )}
        {!isLoading && lineItems.map((item, i) => {
          // Backend sends `amount` (see getEventPnL) — the PLLineItem type's
          // `actual`/`budgeted`/`variance` fields describe a budget-comparison
          // feature that was never actually implemented server-side.
          const amount = (item as any).amount ?? (item as any).actual ?? 0
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px', padding: '14px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
              <div style={{ fontSize: 13, color: '#334155' }}>{item.description}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#F1F5F9', color: '#475569', width: 'fit-content' }}>{item.category}</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: amount < 0 ? '#DC2626' : '#059669' }}>{formatINR(Math.abs(amount))}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
