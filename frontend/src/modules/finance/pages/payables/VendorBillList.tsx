import { useState } from 'react'
import {
  SearchOutlined, CloudUploadOutlined, CheckCircleFilled,
  FileTextOutlined, StarFilled,
} from '@ant-design/icons'
import { Skeleton, message, Modal } from 'antd'
import { useVendorBills, useApprovePayouts } from '../../hooks/useAPDashboard'
import { formatINR } from '../../utils/currencyFormatter'
import { downloadCSV } from '../../utils/exportHelper'
import dayjs from 'dayjs'

export default function VendorBillList() {
  const [selected, setSelected] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [localSearch, setLocalSearch] = useState('')

  const { data: page, isLoading } = useVendorBills({ page: 1, limit: 20, search: localSearch || undefined })
  const approveMutation = useApprovePayouts()
  const bills = page?.data ?? []

  const toggleCheck = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const allChecked = bills.length > 0 && bills.every((b) => selected.includes(b.id))
  const toggleAll = () => { if (allChecked) setSelected([]); else setSelected(bills.map((b) => b.id)) }

  const handleApprove = () => {
    if (selected.length === 0) return
    Modal.confirm({
      title: 'Approve Bills',
      content: `Approve ${selected.length} selected bill(s) for payment?`,
      okText: 'Approve',
      okButtonProps: { style: { background: '#8B1A1A', borderColor: '#8B1A1A' } },
      onOk: async () => {
        try {
          await approveMutation.mutateAsync(selected)
          message.success(`${selected.length} bill(s) approved`)
          setSelected([])
        } catch {
          message.error('Approval failed')
        }
      },
    })
  }

  const totalPayable = bills.reduce((s, b) => s + b.totalAmount, 0)
  const dueToday = bills.filter((b) => dayjs(b.dueDate).isSame(dayjs(), 'day')).reduce((s, b) => s + b.totalAmount, 0)

  const exportQueue = () => {
    if (bills.length === 0) { message.info('No bills to export'); return }
    downloadCSV('vendor-bills', bills.map((b) => ({ id: b.id, vendor: (b as any).vendorName ?? '', amount: b.totalAmount, dueDate: (b as any).dueDate ?? '' })))
    message.success(`Exported ${bills.length} bills`)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2a4a' }}>Accounts Payable</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E8E0D8', borderRadius: 10, padding: '8px 14px', width: 280 }}>
          <SearchOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
          <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search bills or vendors..." style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', background: 'transparent', width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Total Payable</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a2a4a' }}>{isLoading ? '—' : formatINR(totalPayable, { compact: true })}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Due Today</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a2a4a' }}>{isLoading ? '—' : formatINR(dueToday, { compact: true })}</div>
        </div>
      </div>

      {/* ── Middle Section: Upload + Payout Queue ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginBottom: 20 }}>

        {/* Upload Bill */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 14 }}>Upload Bill</div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); setUploaded(true) }}
            style={{
              border: `2px dashed ${dragOver ? '#8B1A1A' : '#E2C4C4'}`,
              borderRadius: 10,
              padding: '28px 16px',
              textAlign: 'center',
              background: dragOver ? 'rgba(139,26,26,0.03)' : '#FDF9F7',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 14,
            }}
          >
            <CloudUploadOutlined style={{ fontSize: 28, color: '#C4A24D', display: 'block', marginBottom: 10 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Drag & drop PDF here
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
              AI will auto-extract<br />vendor and amount
            </div>
          </div>

          {/* Uploaded File */}
          {uploaded && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#FDF9F7', border: '1px solid #E8E0D8',
              borderRadius: 8, padding: '10px 12px',
            }}>
              <FileTextOutlined style={{ color: '#8B1A1A', fontSize: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#334155', flex: 1 }}>INV_9921.pdf</span>
              <CheckCircleFilled style={{ color: '#059669', fontSize: 14 }} />
            </div>
          )}
        </div>

        {/* Vendor Payout Queue */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 10px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Vendor Payout Queue</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Manage and approve outbound vendor payments</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 120px 140px', padding: '8px 20px', background: '#1a2a4a' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: '#8B1A1A' }} />
            </div>
            {['VENDOR & INVOICE', 'AMOUNT', 'DUE DATE'].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>

          {isLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 4 }} /></div>}
          {!isLoading && bills.length === 0 && <div style={{ padding: '32px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>No vendor bills found</div>}

          {!isLoading && bills.map((b, i) => {
            const isOverdue = dayjs(b.dueDate).isBefore(dayjs(), 'day')
            const isDueToday = dayjs(b.dueDate).isSame(dayjs(), 'day')
            const dueLabel = isOverdue ? 'Overdue' : isDueToday ? 'Today' : `In ${dayjs(b.dueDate).diff(dayjs(), 'day')} days`
            const dueLabelColor = isOverdue || isDueToday ? '#DC2626' : '#C4A24D'
            return (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 120px 140px', padding: '16px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB', background: selected.includes(b.id) ? 'rgba(139,26,26,0.03)' : '#fff' }}>
                <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggleCheck(b.id)} style={{ cursor: 'pointer', accentColor: '#8B1A1A' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{b.vendorName}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{b.billNumber} • {b.category}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(b.totalAmount)}</div>
                <div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{dayjs(b.dueDate).format('MMM DD, YYYY')}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: dueLabelColor, marginTop: 2 }}>{dueLabel}</div>
                </div>
              </div>
            )
          })}

          <div style={{ padding: '14px 20px', borderTop: '1px solid #F5F0EB', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={exportQueue} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Export Queue</button>
            <button onClick={handleApprove} disabled={selected.length === 0} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: selected.length === 0 ? '#cbd5e1' : '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: selected.length === 0 ? 'not-allowed' : 'pointer' }}>Approve Selected ({selected.length})</button>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 16 }}>Vendor Health</div>
        {bills.slice(0, 3).map((b) => (
          <div key={b.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StarFilled style={{ color: '#C4A24D', fontSize: 14 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>{b.vendorName}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: b.status === 'paid' ? '#059669' : '#C4A24D', textTransform: 'capitalize' }}>{b.status}</span>
            </div>
            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: b.status === 'paid' ? '100%' : '60%', background: '#8B1A1A', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
