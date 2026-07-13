import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { message, modal } from '@shared/lib/antdStatic'
import { Skeleton, Alert } from 'antd'
import { useARAgingSummary, useARAgingEntries } from '../../hooks/useARDashboard'
import { formatINR } from '../../utils/currencyFormatter'
import { receivableApi } from '../../api/receivableApi'

const BUCKET_COLORS = ['#C4A24D', '#E2946B', '#CC5555', '#8B1A1A']

export default function ARAgingReport() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useARAgingSummary()
  const { data: entriesPage, isLoading: entriesLoading } = useARAgingEntries({ page: 1, limit: 20 })
  const entries = entriesPage?.data ?? []

  const bucketCards = summary?.buckets ?? []

  const handleSendReminder = async (customerId: string) => {
    try {
      await receivableApi.sendReminder(customerId, 'L1')
      message.success('Reminder sent successfully')
    } catch {
      message.error('Failed to send reminder')
    }
  }

  const showHistory = (c: any) => {
    modal.info({
      title: c.customerName,
      content: (
        <div style={{ fontSize: 14, lineHeight: 1.9 }}>
          <div>Total outstanding: <b>{formatINR(c.total)}</b></div>
          <div>Current: {formatINR(c.current)}</div>
          <div>1–30 days: {formatINR(c.days1to30)}</div>
          <div>31–60 days: {formatINR(c.days31to60)}</div>
          <div>61–90 days: {formatINR(c.days61to90)}</div>
          <div>90+ days: {formatINR(c.days90plus)}</div>
        </div>
      ),
      okButtonProps: { style: { background: '#8B1A1A', borderColor: '#8B1A1A' } },
    })
  }
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>AR Aging Report</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Detailed receivables aging analysis by bucket and client</div>
      </div>

      {summaryError && <Alert type="error" message="Failed to load aging data." style={{ marginBottom: 16 }} />}

      <div className="eh-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {summaryLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '16px 18px' }}><Skeleton active paragraph={{ rows: 2 }} title={false} /></div>)
          : bucketCards.map((b, idx) => (
            <div key={b.bucket} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '16px 18px', borderTop: `3px solid ${BUCKET_COLORS[idx] ?? '#94a3b8'}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 6 }}>{b.bucket}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>{formatINR(b.amount, { compact: true })}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{b.count} clients</div>
            </div>
          ))
        }
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 16 }}>Aging Distribution</div>
          {summaryLoading ? <Skeleton active /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={bucketCards} barSize={40}>
                <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v: number) => [formatINR(v, { compact: true })]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {bucketCards.map((_, i) => <Cell key={i} fill={BUCKET_COLORS[i] ?? '#94a3b8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 16 }}>Risk Summary</div>
          {[{ label: 'High Risk (90+ days)', color: '#8B1A1A', pct: 5  },
            { label: 'Medium Risk (61-90)',  color: '#CC5555', pct: 12 },
            { label: 'Low Risk (31-60)',     color: '#E2946B', pct: 19 },
            { label: 'Current (0-30)',       color: '#C4A24D', pct: 64 },
          ].map((r) => (
            <div key={r.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#334155' }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.pct}%</span>
              </div>
              <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${r.pct}%`, background: r.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 110px 80px', padding: '8px 20px', background: '#1a2a4a' }}>
          {['CLIENT', 'TOTAL O/S', 'CURRENT', '31-60 DAYS', 'ACTION', ''].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>
        {entriesLoading && <div style={{ padding: '16px 20px' }}><Skeleton active paragraph={{ rows: 4 }} /></div>}
        {!entriesLoading && entries.map((c, i) => (
          <div key={c.customerId} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 110px 80px', padding: '14px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>{c.customerName}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(c.total)}</div>
            <div style={{ fontSize: 13, color: '#334155' }}>{formatINR(c.current)}</div>
            <div style={{ fontSize: 13, color: c.days31to60 > 0 ? '#DC2626' : '#334155', fontWeight: c.days31to60 > 0 ? 700 : 400 }}>{formatINR(c.days31to60)}</div>
            <button onClick={() => handleSendReminder(c.customerId)} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', color: '#334155', cursor: 'pointer' }}>Send Reminder</button>
            <button onClick={() => showHistory(c)} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#F5F0EB', color: '#64748b', cursor: 'pointer' }}>History</button>
          </div>
        ))}
        {!entriesLoading && entries.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>No aging entries found</div>
        )}
      </div>
    </div>
  )
}
