import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Skeleton, Alert } from 'antd'
import { useCashHealth, useBranchPerformance } from '../../hooks/useFinanceDashboard'
import { usePaymentList } from '../../hooks/usePayments'
import { usePayoutSchedule } from '../../hooks/useAPDashboard'
import { formatINR } from '../../utils/currencyFormatter'
import dayjs from 'dayjs'

export default function CashFlowDashboard() {
  const { data: cashHealth, isLoading, isError } = useCashHealth()
  const { data: branches } = useBranchPerformance()
  const { data: paymentsPage } = usePaymentList({ page: 1, limit: 10 })
  const { data: payoutsPage } = usePayoutSchedule({ page: 1, limit: 10 })

  const weeklyForecast = cashHealth?.weeklyForecast ?? []

  // Real recent cash movements: payments (inflow) + paid payouts (outflow)
  const movements = [
    ...(paymentsPage?.data ?? []).map((p: any) => ({
      kind: 'Inflow', label: `Payment · invoice ${p.invoiceId}`, mode: p.mode ?? p.paymentMode ?? '',
      amount: Number(p.amount), date: p.paidAt ?? p.createdAt,
    })),
    ...(payoutsPage?.data ?? []).filter((p: any) => p.status === 'paid').map((p: any) => ({
      kind: 'Outflow', label: `Vendor payout ${p.vendorInvoiceId ?? p.id}`, mode: '',
      amount: -Number(p.amount), date: p.paidAt ?? p.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)

  const inflows = cashHealth?.inflows ?? 0
  const outflows = cashHealth?.outflows ?? 0
  const flowTotal = inflows + outflows || 1

  // Real strategic insights derived from the data
  const insights: Array<{ type: string; icon: string; iconBg: string; title: string; desc: string }> = []
  if (cashHealth) {
    insights.push({
      type: 'Liquidity', icon: '💧', iconBg: '#D1FAE5',
      title: `Net liquidity ${formatINR(cashHealth.netLiquidity, { compact: true })}`,
      desc: `Inflows ${formatINR(inflows, { compact: true })} against outflows ${formatINR(outflows, { compact: true })} to date.`,
    })
    insights.push({
      type: cashHealth.healthScore >= 70 ? 'Healthy' : 'Risk Alert',
      icon: cashHealth.healthScore >= 70 ? '✅' : '⚠️',
      iconBg: cashHealth.healthScore >= 70 ? '#D1FAE5' : '#FEE2E2',
      title: `Runway ${cashHealth.opexRunway.toFixed(1)} months`,
      desc: `Health score ${cashHealth.healthScore}/100 based on the current inflow-to-outflow ratio.`,
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Cash Flow</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Liquidity, inflows and outflows · all amounts in INR</div>
        </div>
        {cashHealth?.lastPaymentAt && (
          <span style={{ fontSize: 12, color: '#64748b', background: '#F5F0EB', padding: '5px 12px', borderRadius: 20 }}>
            Last payment {dayjs(cashHealth.lastPaymentAt).format('MMM DD, YYYY')}
          </span>
        )}
      </div>

      {isError && <Alert type="error" message="Failed to load cash health data." style={{ marginBottom: 16 }} />}

      {/* Hero: Cash Health */}
      <div style={{ background: 'linear-gradient(135deg, #1a2a4a 0%, #2d4a7a 100%)', borderRadius: 14, padding: '24px 28px', marginBottom: 20, color: '#fff' }}>
        <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Cash Health</div>
        {isLoading
          ? <Skeleton active paragraph={{ rows: 1 }} style={{ filter: 'invert(1) opacity(0.4)' }} />
          : (
            <div className="eh-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
              {[
                { label: 'Net Liquidity', value: cashHealth ? formatINR(cashHealth.netLiquidity, { compact: true }) : '—', delta: 'Inflows − Outflows', deltaColor: '#C4A24D' },
                { label: 'OPEX Runway',   value: cashHealth ? `${cashHealth.opexRunway.toFixed(1)} Mo` : '—', delta: 'At current burn', deltaColor: '#C4A24D' },
                { label: 'Health Score',  value: cashHealth ? `${cashHealth.healthScore}/100` : '—', delta: cashHealth && cashHealth.healthScore >= 80 ? 'Excellent' : cashHealth && cashHealth.healthScore >= 50 ? 'Stable' : 'Needs attention', deltaColor: cashHealth && cashHealth.healthScore >= 50 ? '#059669' : '#DC2626' },
                { label: 'Total Inflows', value: cashHealth ? formatINR(inflows, { compact: true }) : '—', delta: 'Payments received', deltaColor: '#94a3b8' },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{m.value}</div>
                  <div style={{ fontSize: 12, color: m.deltaColor, marginTop: 6, fontWeight: 500 }}>{m.delta}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Weekly Liquidity Forecast (real) */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Weekly Liquidity</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Last 6 weeks of received payments vs projected burn</div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
              <span style={{ width: 10, height: 10, background: '#8B1A1A', borderRadius: 2, display: 'inline-block' }} /> Received
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
              <span style={{ width: 10, height: 10, background: '#C4A24D', borderRadius: 2, display: 'inline-block' }} /> Projected burn
            </span>
          </div>
        </div>
        {isLoading
          ? <Skeleton active paragraph={{ rows: 3 }} />
          : weeklyForecast.some((w) => w.historical > 0 || w.projected > 0)
            ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyForecast} barSize={28}>
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatINR(v, { compact: true })} width={60} />
                  <Tooltip formatter={(v: number, n) => [formatINR(v), n === 'historical' ? 'Received' : 'Projected burn']} contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D8', fontSize: 12 }} />
                  <Bar dataKey="historical" radius={[4, 4, 0, 0]} fill="#8B1A1A" isAnimationActive={false} />
                  <Bar dataKey="projected"  radius={[4, 4, 0, 0]} fill="#C4A24D" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )
            : <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 14 }}>No recent cash activity</div>
        }
      </div>

      {/* Recent Cash Movements + Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 10px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Recent Cash Movements</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Payments received and vendor payouts disbursed</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 120px 130px', padding: '8px 20px', background: '#1a2a4a' }}>
            {['SOURCE', 'TYPE', 'DATE', 'AMOUNT'].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>
          {movements.length === 0 && <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No cash movements yet</div>}
          {movements.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 120px 130px', padding: '14px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>{m.label}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, width: 'fit-content', background: m.kind === 'Inflow' ? '#D1FAE5' : '#FEE2E2', color: m.kind === 'Inflow' ? '#065F46' : '#991B1B' }}>{m.kind}</span>
              <div style={{ fontSize: 13, color: '#64748b' }}>{dayjs(m.date).format('MMM DD, YYYY')}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: m.amount >= 0 ? '#059669' : '#DC2626' }}>{m.amount >= 0 ? '+' : '−'}{formatINR(Math.abs(m.amount))}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 14 }}>Strategic Insights</div>
          {insights.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No insights available</div>}
          {insights.map((ins, i) => (
            <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < insights.length - 1 ? '1px solid #F5F0EB' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: ins.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{ins.icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 3 }}>{ins.type}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a', marginBottom: 4 }}>{ins.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{ins.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inflow vs Outflow + Revenue by Branch (real) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 16 }}>Inflow vs Outflow</div>
          {[
            { label: 'Inflows (payments received)', amount: inflows, color: '#059669' },
            { label: 'Outflows (expenses + payouts)', amount: outflows, color: '#DC2626' },
          ].map((row) => (
            <div key={row.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: '#334155' }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(row.amount, { compact: true })}</span>
              </div>
              <div style={{ height: 9, background: '#F1F5F9', borderRadius: 5 }}>
                <div style={{ height: '100%', width: `${Math.round((row.amount / flowTotal) * 100)}%`, background: row.color, borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 14 }}>Revenue by Branch</div>
          {(branches ?? []).length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No branch data</div>}
          {(branches ?? []).map((b: any, i: number) => (
            <div key={b.branchId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B1A1A', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#334155' }}>{b.branchName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(b.revenue, { compact: true })}</span>
                <span style={{ fontSize: 11, color: '#8B1A1A', background: '#FBEAEA', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{b.sharePct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
