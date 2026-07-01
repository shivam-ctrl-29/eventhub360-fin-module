import { useState } from 'react'
import { message, modal } from '@shared/lib/antdStatic'
import { LinkOutlined, UndoOutlined } from '@ant-design/icons'
import { Skeleton, Alert } from 'antd'
import { useReconciliationEntries, useMatchEntry, useUnmatchEntry } from '../../hooks/useReconciliation'
import { useInvoiceList } from '../../hooks/useInvoices'
import { formatINR } from '../../utils/currencyFormatter'
import dayjs from 'dayjs'

export default function ReconciliationDesk() {
  const [localMatched, setLocalMatched] = useState<Record<string, string>>({})
  const [view, setView] = useState<'unmatched' | 'reconciled'>('unmatched')

  // Two separate queries — one for the working queue (what still needs action),
  // one for everything already settled (for stats + the "view reconciled" tab).
  // The backend now actually applies this filter server-side.
  const { data: unmatchedPage, isLoading: unmatchedLoading, isError: entriesError } = useReconciliationEntries({ page: 1, limit: 20, reconciled: false })
  const { data: reconciledPage, isLoading: reconciledLoading } = useReconciliationEntries({ page: 1, limit: 100, reconciled: true })
  // Fetch broadly rather than filtering by a single hardcoded status — "outstanding"
  // means it's been sent to the client (Issued/Overdue) and still has a balance,
  // which is a real, resilient criterion instead of one brittle status string.
  const { data: invoicesPage, isLoading: invoicesLoading } = useInvoiceList({ page: 1, limit: 100 })
  const matchMutation = useMatchEntry()
  const unmatchMutation = useUnmatchEntry()

  const unmatchedEntries  = unmatchedPage?.data ?? []
  const reconciledEntries = reconciledPage?.data ?? []
  const displayedEntries  = view === 'unmatched' ? unmatchedEntries : reconciledEntries

  const allInvoices = invoicesPage?.data ?? []
  const invoices = allInvoices.filter((inv) => {
    const balance = (inv as any).balance ?? inv.grandTotal ?? 0
    return balance > 0 && (inv.status === 'Issued' || inv.status === 'Overdue')
  })

  const handleMatch = (entryId: string, invoiceId: string) => {
    setLocalMatched((p) => ({ ...p, [entryId]: invoiceId }))
  }

  const handleSettle = (entryId: string) => {
    const invoiceId = localMatched[entryId]
    if (!invoiceId) return
    const inv = invoices.find((i) => i.id === invoiceId)
    modal.confirm({
      title: 'Reconcile Payment',
      content: `Match this bank entry to ${inv?.invoiceNumber ?? invoiceId}?`,
      okText: 'Reconcile',
      okButtonProps: { style: { background: '#8B1A1A', borderColor: '#8B1A1A' } },
      onOk: async () => {
        try {
          await matchMutation.mutateAsync({ entryId, invoiceId })
          message.success('Entry reconciled successfully')
          setLocalMatched((p) => { const next = { ...p }; delete next[entryId]; return next })
        } catch {
          message.error('Failed to reconcile entry')
        }
      },
    })
  }

  const handleUnmatch = (entryId: string) => {
    modal.confirm({
      title: 'Undo Reconciliation',
      content: 'Move this entry back to the unmatched queue?',
      okText: 'Undo',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await unmatchMutation.mutateAsync(entryId)
          message.success('Entry moved back to unmatched')
        } catch {
          message.error('Failed to undo reconciliation')
        }
      },
    })
  }

  const autoReconcile = async () => {
    if (unmatchedEntries.length === 0) { message.info('Nothing left to reconcile'); return }
    let matched = 0
    for (const e of unmatchedEntries) {
      const inv = invoices.find((i) => Math.round(((i as any).grandTotal ?? (i as any).total ?? 0)) === Math.round((e as any).amount ?? 0))
      if (inv) {
        try { await matchMutation.mutateAsync({ entryId: e.id, invoiceId: inv.id }); matched++ } catch { /* skip */ }
      }
    }
    if (matched > 0) message.success(`Auto-reconciled ${matched} of ${unmatchedEntries.length} entries`)
    else message.warning('No matching invoices found for the open entries')
  }

  const isLoading = unmatchedLoading || invoicesLoading
  const entriesLoading = view === 'unmatched' ? unmatchedLoading : reconciledLoading

  const unmatchedCount  = unmatchedEntries.length
  const matchedCount    = Object.keys(localMatched).length
  const reconciledTodayCount = reconciledEntries.filter((e) => e.updatedAt && dayjs(e.updatedAt).isSame(dayjs(), 'day')).length
  const totalCount      = unmatchedCount + reconciledEntries.length
  const reconciledRate  = totalCount === 0 ? 0 : Math.round((reconciledEntries.length / totalCount) * 100)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Payment Reconciliation Desk</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Match bank transactions to invoices and settle payments</div>
      </div>

      {entriesError && <Alert type="error" message="Failed to load reconciliation data." style={{ marginBottom: 16 }} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '16px 18px' }}><Skeleton active paragraph={{ rows: 1 }} title={false} /></div>)
          : [
              { label: 'Unmatched Entries',   value: String(unmatchedCount),        color: '#DC2626' },
              { label: 'Matched',             value: String(matchedCount),          color: '#C4A24D' },
              { label: 'Reconciled Today',    value: String(reconciledTodayCount),  color: '#059669' },
              { label: 'Reconciliation Rate', value: `${reconciledRate}%`,          color: '#1a2a4a' },
            ].map((k) => (
              <div key={k.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '16px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))
        }
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Bank Transactions */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Bank Statement Entries</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{view === 'unmatched' ? 'Unreconciled bank transactions' : 'Already reconciled — click to undo'}</div>
            </div>
            <div style={{ display: 'flex', background: '#F5F0EB', borderRadius: 8, padding: 3 }}>
              {(['unmatched', 'reconciled'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: view === v ? '#fff' : 'transparent', color: view === v ? '#8B1A1A' : '#94a3b8', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                  {v === 'unmatched' ? 'Unmatched' : 'Reconciled'}
                </button>
              ))}
            </div>
          </div>
          {entriesLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 4 }} /></div>}
          {!entriesLoading && displayedEntries.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>
              {view === 'unmatched' ? 'No unreconciled entries' : 'No reconciled entries yet'}
            </div>
          )}
          {!entriesLoading && displayedEntries.map((entry, i) => {
            const done = entry.isReconciled
            const ref  = entry as unknown as { utrNumber?: string; bankName?: string; narration?: string; amount: number; date: string; id: string; isReconciled: boolean }
            return (
              <div key={entry.id} style={{ padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a' }}>{ref.utrNumber ?? entry.id.slice(0, 12)}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{ref.bankName ?? 'Bank'} · {dayjs(ref.date ?? entry.date).format('MMM DD, YYYY')}</div>
                    {ref.narration && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{ref.narration}</div>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>{formatINR(ref.amount)}</div>
                </div>
                {!done && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <select onChange={(e) => handleMatch(entry.id, e.target.value)} style={{ flex: 1, padding: '6px 10px', border: '1px solid #E8E0D8', borderRadius: 6, fontSize: 12, color: '#334155', outline: 'none' }}>
                      <option value="">— Match to Invoice —</option>
                      {invoices.map((inv) => <option key={inv.id} value={inv.id}>{inv.invoiceNumber} · {formatINR((inv as any).grandTotal ?? inv.total)}</option>)}
                    </select>
                    <button onClick={() => handleSettle(entry.id)} disabled={!localMatched[entry.id]} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: localMatched[entry.id] ? '#8B1A1A' : '#F1F5F9', color: localMatched[entry.id] ? '#fff' : '#94a3b8', cursor: localMatched[entry.id] ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LinkOutlined style={{ fontSize: 14 }} />
                    </button>
                  </div>
                )}
                {done && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>✓ Reconciled</span>
                    <button onClick={() => handleUnmatch(entry.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#DC2626', background: 'transparent', border: '1px solid #FEE2E2', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                      <UndoOutlined style={{ fontSize: 11 }} /> Undo
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Outstanding Invoices */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 10px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Outstanding Invoices</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Pending payment collection</div>
          </div>
          {invoicesLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 4 }} /></div>}
          {!invoicesLoading && invoices.length === 0 && <div style={{ padding: '32px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>No outstanding invoices</div>}
          {!invoicesLoading && invoices.map((inv, i) => {
            const isMatched = Object.values(localMatched).includes(inv.id)
            return (
              <div key={inv.id} style={{ padding: '16px 20px', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#8B1A1A' }}>{inv.invoiceNumber}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, textTransform: 'capitalize' }}>{inv.status}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1a2a4a' }}>{formatINR((inv as any).grandTotal ?? inv.total)}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isMatched ? '#DBEAFE' : '#FEF3C7', color: isMatched ? '#1E40AF' : '#92400E' }}>
                    {isMatched ? 'Matched' : 'Pending'}
                  </span>
                </div>
              </div>
            )
          })}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #E8E0D8' }}>
            <button onClick={autoReconcile} style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Auto-Reconcile All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
