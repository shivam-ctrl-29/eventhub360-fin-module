import { useState } from 'react'
import { message, modal } from '@shared/lib/antdStatic'
import { CaretRightOutlined, MoreOutlined, DownloadOutlined } from '@ant-design/icons'
import { Skeleton, Alert, Dropdown } from 'antd'
import { useARAgingSummary, useARAgingEntries } from '../../hooks/useARDashboard'
import { useAPAgingSummary } from '../../hooks/useAPDashboard'
import { formatINR } from '../../utils/currencyFormatter'
import { downloadCSV } from '../../utils/exportHelper'

const BUCKET_COLORS = ['#C4A24D', '#E2946B', '#CC5555', '#8B1A1A']

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#FEF3C7', color: '#92400E' },
  delinquent: { bg: '#FEE2E2', color: '#991B1B' },
  current:    { bg: '#F1F5F9', color: '#475569' },
  paid:       { bg: '#D1FAE5', color: '#065F46' },
}

export default function ARAPAgingDashboard() {
  const [view, setView] = useState<'All Clients' | 'Overdue Only'>('All Clients')

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useARAgingSummary()
  const { data: entriesPage, isLoading: entriesLoading } = useARAgingEntries({ page: 1, limit: 20 })
  const { data: apAging, isLoading: apLoading } = useAPAgingSummary()

  const buckets   = summary?.buckets ?? []
  const entries   = entriesPage?.data ?? []
  const totalOut  = buckets.reduce((s, b) => s + b.amount, 0)

  const displayed = view === 'Overdue Only'
    ? entries.filter((e) => e.days31to60 > 0 || e.days61to90 > 0 || (e.days90plus ?? (e as any).over90 ?? 0) > 0)
    : entries

  const showAccount = (c: any) => {
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

  const exportAccounts = () => {
    if (displayed.length === 0) { message.info('No accounts to export'); return }
    downloadCSV('ar-aging-accounts', displayed.map((c: any) => ({
      customer: c.customerName, total: c.total, current: c.current,
      days1to30: c.days1to30, days31to60: c.days31to60, days61to90: c.days61to90, days90plus: c.days90plus,
    })))
    message.success(`Exported ${displayed.length} accounts`)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Enterprise Ledger</div>
        <button onClick={exportAccounts} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E8E0D8', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#334155', cursor: 'pointer' }}>
          <DownloadOutlined style={{ color: '#8B1A1A' }} /> Export Accounts
        </button>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a2a4a', marginBottom: 24, lineHeight: 1.2 }}>AR / AP Aging</h1>

      {summaryError && <Alert type="error" message="Failed to load aging data." style={{ marginBottom: 16 }} />}

      {/* Hero KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Total Outstanding</div>
          {summaryLoading
            ? <Skeleton active paragraph={{ rows: 1 }} title={false} />
            : <div style={{ fontSize: 28, fontWeight: 800, color: '#1a2a4a', lineHeight: 1 }}>{formatINR(totalOut, { compact: true })}</div>
          }
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Avg Collection Days</div>
          {summaryLoading
            ? <Skeleton active paragraph={{ rows: 1 }} title={false} />
            : (
              <>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1a2a4a', lineHeight: 1 }}>{summary?.avgCollectionDays?.toFixed(1) ?? '—'} Days</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Across {entriesPage?.total ?? 0} outstanding invoice{(entriesPage?.total ?? 0) === 1 ? '' : 's'}</div>
              </>
            )
          }
        </div>
      </div>

      {/* Aging Buckets Distribution */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 18 }}>Aging Buckets Distribution</div>
        {summaryLoading
          ? <Skeleton active paragraph={{ rows: 4 }} />
          : buckets.map((b, i) => {
              const pct = totalOut > 0 ? Math.round((b.amount / totalOut) * 100) : 0
              return (
                <div key={b.bucket} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#334155' }}>{b.bucket}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(b.amount, { compact: true })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: BUCKET_COLORS[i] ?? '#94a3b8', borderRadius: 5 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', width: 28, textAlign: 'right' }}>{pct}%</span>
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* Customer Accounts Ledger */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '18px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Customer Accounts Ledger</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Real-time outstanding balance tracking and automated recovery actions</div>
          </div>
          <div style={{ display: 'flex', background: '#F5F0EB', borderRadius: 8, padding: 3 }}>
            {(['All Clients', 'Overdue Only'] as const).map((tab) => (
              <button key={tab} onClick={() => setView(tab)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: view === tab ? '#fff' : 'transparent', color: view === tab ? '#1a2a4a' : '#94a3b8', boxShadow: view === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 80px', padding: '8px 20px', background: '#1a2a4a' }}>
          {['CLIENT NAME', 'TOTAL O/S', 'CURRENT', '31-60 DAYS', '60+ DAYS', 'ACTIONS'].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {entriesLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 5 }} /></div>}
        {!entriesLoading && displayed.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>No accounts found</div>
        )}
        {!entriesLoading && displayed.map((entry, i) => {
          const isOverdue = entry.days31to60 > 0 || entry.days61to90 > 0 || entry.days90plus > 0
          const statusKey = isOverdue ? (entry.days90plus > 0 ? 'delinquent' : 'pending') : 'current'
          const statusStyle = STATUS_STYLES[statusKey]
          const initials = entry.customerName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div key={entry.customerId} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 80px', padding: '16px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1a2a4a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>{entry.customerName}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color, marginTop: 3 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusStyle.color, display: 'inline-block' }} />
                    {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(entry.total)}</div>
              <div style={{ fontSize: 13, color: '#334155' }}>{formatINR(entry.current)}</div>
              <div style={{ fontSize: 13, fontWeight: entry.days31to60 > 0 ? 700 : 400, color: entry.days31to60 > 0 ? '#DC2626' : '#334155' }}>{formatINR(entry.days31to60)}</div>
              <div style={{ fontSize: 13, fontWeight: (entry.days61to90 + entry.days90plus) > 0 ? 700 : 400, color: (entry.days61to90 + entry.days90plus) > 0 ? '#991B1B' : '#334155' }}>{formatINR(entry.days61to90 + entry.days90plus)}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => showAccount(entry)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CaretRightOutlined style={{ fontSize: 12, color: '#8B1A1A' }} />
                </button>
                <Dropdown
                  trigger={['click']}
                  menu={{ items: [
                    { key: 'view', label: 'View breakdown', onClick: () => showAccount(entry) },
                    { key: 'export', label: 'Export accounts', onClick: exportAccounts },
                  ] }}
                >
                  <button style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MoreOutlined style={{ fontSize: 12, color: '#64748b' }} />
                  </button>
                </Dropdown>
              </div>
            </div>
          )
        })}

        <div style={{ padding: '12px 20px', borderTop: '1px solid #F5F0EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Showing {displayed.length} of {entriesPage?.total ?? 0} accounts</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['‹', '›'].map((a) => (
              <button key={a} onClick={() => message.info('All accounts are shown on a single page')} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#334155' }}>{a}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts Payable Aging — real, from scheduled vendor payouts */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Accounts Payable Aging</div>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Total payable {formatINR(apAging?.totalPayable ?? 0, { compact: true })} · {apAging?.openCount ?? 0} open</span>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Unpaid vendor payouts bucketed by days past their scheduled date</div>
        {apLoading
          ? <Skeleton active paragraph={{ rows: 3 }} />
          : (apAging?.totalPayable ?? 0) === 0
            ? <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>No outstanding payables</div>
            : (() => {
                const apBuckets = apAging?.buckets ?? []
                const apMax = Math.max(...apBuckets.map((b) => b.amount), 1)
                const apColors = ['#94a3b8', '#C4A24D', '#E06666', '#8B1A1A']
                return apBuckets.map((b, i) => (
                  <div key={b.bucket} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#334155' }}>{b.bucket}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(b.amount, { compact: true })}</span>
                    </div>
                    <div style={{ height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((b.amount / apMax) * 100)}%`, background: apColors[i % apColors.length], borderRadius: 5 }} />
                    </div>
                  </div>
                ))
              })()
        }
      </div>
    </div>
  )
}
