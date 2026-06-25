import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Skeleton, Alert } from 'antd'
import { useCashHealth } from '../../hooks/useFinanceDashboard'
import { formatINR } from '../../utils/currencyFormatter'

const intercompany = [
  { from: 'London Branch',  to: 'Dubai Operations', type: 'SETTLEMENT', amount: '$1,200,000', color: '#DBEAFE', textColor: '#1E40AF' },
  { from: 'Singapore CBD',  to: 'HQ Global',        type: 'FUNDING',    amount: '$840,000',  color: '#D1FAE5', textColor: '#065F46' },
  { from: 'Mumbai Events',  to: 'London Branch',    type: 'DIVIDEND',   amount: '$320,000',  color: '#FEF3C7', textColor: '#92400E' },
]

const currencyRisks = [
  { pair: 'GBP/USD', risk: 'High',   riskColor: '#DC2626', riskBg: '#FEE2E2', pct: 82 },
  { pair: 'INR/USD', risk: 'Med',    riskColor: '#C4A24D', riskBg: '#FEF3C7', pct: 55 },
  { pair: 'AED/USD', risk: 'Stable', riskColor: '#059669', riskBg: '#D1FAE5', pct: 28 },
]

const regionalDrivers = [
  { branch: 'London Branch',    amount: '-$2.1M', flow: 'outflow', color: '#DC2626' },
  { branch: 'Dubai Operations', amount: '+$8.4M', flow: 'inflow',  color: '#059669' },
  { branch: 'Singapore CBD',    amount: '+$3.2M', flow: 'inflow',  color: '#059669' },
  { branch: 'Mumbai Events',    amount: '-$0.8M', flow: 'outflow', color: '#DC2626' },
]

const aiInsights = [
  { type: 'Optimization', icon: '💡', iconBg: '#D1FAE5', title: 'Move $1.2M Mumbai → London', desc: 'Reallocation reduces idle cash by 18% and improves London runway by 2.4 months.' },
  { type: 'Risk Alert',   icon: '⚠️', iconBg: '#FEE2E2', title: 'Dubai cash burn 15% above forecast', desc: 'At current rate, Dubai ops runway drops below 4 months by Dec 2024.' },
]

export default function CashFlowDashboard() {
  const [company,  setCompany]  = useState('Global Events Inc.')
  const [region,   setRegion]   = useState('Consolidated')
  const [currency, setCurrency] = useState('USD')

  const { data: cashHealth, isLoading, isError } = useCashHealth()

  const weeklyForecast = cashHealth?.weeklyForecast ?? []

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Company',  value: company,  set: setCompany,  options: ['Global Events Inc.', 'EventHub India', 'EventHub UAE'] },
          { label: 'Region',   value: region,   set: setRegion,   options: ['Consolidated', 'Asia Pacific', 'EMEA', 'Americas'] },
          { label: 'Currency', value: currency, set: setCurrency, options: ['USD', 'INR', 'GBP', 'AED'] },
        ].map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.label}</span>
            <select value={s.value} onChange={(e) => s.set(e.target.value)} style={{ fontSize: 12, border: '1px solid #E8E0D8', borderRadius: 6, padding: '4px 10px', color: '#334155', background: '#fff', cursor: 'pointer' }}>
              {s.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '4px 10px', borderRadius: 20 }}>🤖 AI Copilot Active</span>
        </div>
      </div>

      {isError && <Alert type="error" message="Failed to load cash health data." style={{ marginBottom: 16 }} />}

      {/* Hero: Global Cash Health */}
      <div style={{ background: 'linear-gradient(135deg, #1a2a4a 0%, #2d4a7a 100%)', borderRadius: 14, padding: '24px 28px', marginBottom: 20, color: '#fff' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Global Cash Health</div>
        {isLoading
          ? <Skeleton active paragraph={{ rows: 1 }} style={{ filter: 'invert(1) opacity(0.4)' }} />
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
              {[
                { label: 'Net Liquidity', value: cashHealth ? formatINR(cashHealth.netLiquidity, { compact: true }) : '—', delta: '', deltaColor: '#C4A24D' },
                { label: 'OPEX Runway',   value: cashHealth ? `${cashHealth.opexRunway.toFixed(1)} Mo` : '—', delta: 'Conservative Scenario', deltaColor: '#C4A24D' },
                { label: 'Health Score',  value: cashHealth ? `${cashHealth.healthScore}/100` : '—', delta: cashHealth && cashHealth.healthScore >= 80 ? 'Excellent' : 'Needs attention', deltaColor: cashHealth && cashHealth.healthScore >= 80 ? '#059669' : '#DC2626' },
                { label: 'Reconciled',    value: '2m ago', delta: 'Auto-sync active', deltaColor: '#94a3b8' },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: m.deltaColor, marginTop: 6, fontWeight: 500 }}>{m.delta}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Liquidity Forecast Chart */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Weekly Liquidity Forecast</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>8-week rolling cash projection</div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
              <span style={{ width: 10, height: 10, background: '#8B1A1A', borderRadius: 2, display: 'inline-block' }} /> Historical
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
              <span style={{ width: 10, height: 10, background: '#C4A24D', borderRadius: 2, display: 'inline-block' }} /> Projection
            </span>
          </div>
        </div>
        {isLoading
          ? <Skeleton active paragraph={{ rows: 3 }} />
          : weeklyForecast.length > 0
            ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyForecast} barSize={28}>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}M`} />
                  <Tooltip formatter={(v: number) => [`${v}M`]} contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D8', fontSize: 11 }} />
                  <Bar dataKey="historical" radius={[4, 4, 0, 0]} fill="#8B1A1A" />
                  <Bar dataKey="projected"  radius={[4, 4, 0, 0]} fill="#C4A24D" />
                </BarChart>
              </ResponsiveContainer>
            )
            : <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>No forecast data available</div>
        }
      </div>

      {/* Intercompany + AI Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 10px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Intercompany Transaction Ledger</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Real-time cross-entity fund movements</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px 130px', padding: '8px 20px', background: '#1a2a4a' }}>
            {['ENTITY FROM', 'ENTITY TO', 'TYPE', 'AMOUNT'].map((h) => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>
          {intercompany.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px 130px', padding: '14px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2a4a' }}>{r.from}</div>
              <div style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>→</span> {r.to}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: r.color, color: r.textColor }}>{r.type}</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a' }}>{r.amount}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a', marginBottom: 14 }}>AI Strategic Insights</div>
          {aiInsights.map((ins, i) => (
            <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < aiInsights.length - 1 ? '1px solid #F5F0EB' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: ins.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{ins.icon}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 3 }}>{ins.type}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2a4a', marginBottom: 4 }}>{ins.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{ins.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Currency Risk + Regional Drivers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 16 }}>Currency Exposure Risk</div>
          {currencyRisks.map((c) => (
            <div key={c.pair} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a' }}>{c.pair}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: c.riskBg, color: c.riskColor }}>{c.risk}</span>
              </div>
              <div style={{ height: 7, background: '#F1F5F9', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${c.pct}%`, background: c.riskColor, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 14 }}>Regional Cash Drivers</div>
          {regionalDrivers.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#334155' }}>{r.branch}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.amount}</span>
                <span style={{ fontSize: 10, color: r.color, background: r.flow === 'inflow' ? '#D1FAE5' : '#FEE2E2', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{r.flow}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
