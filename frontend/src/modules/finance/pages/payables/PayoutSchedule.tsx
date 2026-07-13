import { useState } from 'react'
import { message, modal } from '@shared/lib/antdStatic'
import { CalendarOutlined, CheckOutlined } from '@ant-design/icons'
import { Skeleton } from 'antd'
import { usePayoutSchedule, useApprovePayouts, useDisburse } from '../../hooks/useAPDashboard'
import { formatINR } from '../../utils/currencyFormatter'
import { downloadCSV } from '../../utils/exportHelper'
import dayjs from 'dayjs'

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#FEE2E2', color: '#991B1B' },
  high:     { bg: '#FEF3C7', color: '#92400E' },
  medium:   { bg: '#DBEAFE', color: '#1E40AF' },
  low:      { bg: '#F1F5F9', color: '#475569' },
}

export default function PayoutSchedule() {
  const [selected, setSelected] = useState<string[]>([])
  const { data: page, isLoading } = usePayoutSchedule({ page: 1, limit: 20 })
  const approveMutation = useApprovePayouts()
  const disburseMutation = useDisburse()

  const payouts = page?.data ?? []
  const pending = payouts.filter((p) => p.status === 'pending')
  const approved = payouts.filter((p) => p.status === 'approved')

  const toggleSelect = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const scheduleBatch = () => {
    const unpaid = payouts.filter((p) => p.status !== 'paid').map((p) => p.id)
    if (unpaid.length === 0) { message.info('No pending payouts to schedule'); return }
    setSelected(unpaid)
    message.success(`${unpaid.length} payout(s) selected — review and confirm below`)
  }

  const exportSchedule = () => {
    if (payouts.length === 0) { message.info('No payouts to export'); return }
    downloadCSV('payout-schedule', payouts.map((p) => ({
      id: p.id,
      vendor: (p as any).vendorName ?? (p as any).vendorInvoiceId ?? '',
      amount: p.amount,
      status: p.status,
      scheduledDate: (p as any).scheduledDate ?? '',
    })))
    message.success(`Exported ${payouts.length} payouts`)
  }

  const handleApproveDisburse = () => {
    if (selected.length === 0) return
    modal.confirm({
      title: 'Approve & Disburse',
      content: `Disburse ${selected.length} selected payout(s)?`,
      okText: 'Confirm',
      okButtonProps: { style: { background: '#8B1A1A', borderColor: '#8B1A1A' } },
      onOk: async () => {
        try {
          await approveMutation.mutateAsync(selected)
          await disburseMutation.mutateAsync(selected)
          message.success('Payouts disbursed successfully')
          setSelected([])
        } catch {
          message.error('Failed to disburse payouts')
        }
      },
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Payout Schedule</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Manage and approve vendor payment disbursements</div>
        </div>
        <button onClick={scheduleBatch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <CalendarOutlined /> Schedule Batch Payout
        </button>
      </div>

      <div className="eh-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Pending',    value: isLoading ? '—' : formatINR(pending.reduce((s, p) => s + p.amount, 0), { compact: true }), color: '#8B1A1A' },
          { label: 'Pending Items',    value: isLoading ? '—' : `${pending.length} payouts`, color: '#DC2626' },
          { label: 'Approved',         value: isLoading ? '—' : `${approved.length} payouts`, color: '#059669' },
          { label: 'Selected',         value: `${selected.length} selected`, color: '#C4A24D' },
        ].map((k) => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '36px 120px 1.5fr 130px 110px 100px 80px', padding: '8px 20px', background: '#1a2a4a' }}>
          {['', 'PAYOUT ID', 'VENDOR', 'AMOUNT', 'SCHEDULED DATE', 'PRIORITY', 'STATUS'].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {isLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 5 }} /></div>}
        {!isLoading && payouts.length === 0 && <div style={{ padding: '32px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>No payouts scheduled</div>}

        {!isLoading && payouts.map((p, i) => {
          const prStyle = PRIORITY_COLORS[p.priority] ?? PRIORITY_COLORS['low']
          const isSelected = selected.includes(p.id)
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '36px 120px 1.5fr 130px 110px 100px 80px', padding: '14px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB', opacity: p.status === 'disbursed' ? 0.7 : 1 }}>
              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} style={{ cursor: 'pointer', accentColor: '#8B1A1A' }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#8B1A1A' }}>{p.id.slice(0, 12)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>{(p as any).vendorName ?? (p as any).vendorInvoiceId ?? 'Vendor'}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(p.amount)}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{(p as any).scheduledDate ? dayjs((p as any).scheduledDate).format('MMM DD, YYYY') : '—'}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: prStyle.bg, color: prStyle.color, textTransform: 'capitalize' }}>{(p as any).priority ?? 'normal'}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: p.status === 'disbursed' ? '#059669' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                {p.status === 'disbursed' ? <><CheckOutlined style={{ fontSize: 12 }} /> Done</> : p.status}
              </span>
            </div>
          )
        })}

        <div style={{ padding: '14px 20px', borderTop: '1px solid #E8E0D8', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={exportSchedule} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', fontSize: 13, color: '#334155', cursor: 'pointer' }}>Export Schedule</button>
          <button onClick={handleApproveDisburse} disabled={selected.length === 0} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: selected.length === 0 ? '#cbd5e1' : '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: selected.length === 0 ? 'not-allowed' : 'pointer' }}>Approve & Disburse ({selected.length})</button>
        </div>
      </div>
    </div>
  )
}
