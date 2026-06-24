import { useState } from 'react'
import { SendOutlined } from '@ant-design/icons'
import { Skeleton, message, Modal } from 'antd'
import { useDunningQueue, useSendReminder } from '../../hooks/useARDashboard'
import { formatINR } from '../../utils/currencyFormatter'
import dayjs from 'dayjs'

const LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  L1: { bg: '#FEF3C7', color: '#92400E' },
  L2: { bg: '#FED7AA', color: '#7C2D12' },
  L3: { bg: '#FEE2E2', color: '#991B1B' },
}

export default function DunningManagement() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: queuePage, isLoading } = useDunningQueue({ page: 1, limit: 20 })
  const sendReminder = useSendReminder()
  const queue = queuePage?.data ?? []

  const l1 = queue.filter((d) => d.dunningLevel === 'L1').length
  const l2 = queue.filter((d) => d.dunningLevel === 'L2').length
  const l3 = queue.filter((d) => d.dunningLevel === 'L3').length

  const handleSend = (customerId: string, level: string) => {
    Modal.confirm({
      title: 'Send Reminder',
      content: `Send a ${level} reminder to this client?`,
      okText: 'Send',
      okButtonProps: { style: { background: '#8B1A1A', borderColor: '#8B1A1A' } },
      onOk: async () => {
        try {
          await sendReminder.mutateAsync({ customerId, level })
          message.success('Reminder sent successfully')
        } catch {
          message.error('Failed to send reminder')
        }
      },
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Dunning Management</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Automated overdue collection workflow and escalation tracking</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[{ label: 'Level 1 — Soft Remind', count: l1, color: '#C4A24D' }, { label: 'Level 2 — Follow-up', count: l2, color: '#E2946B' }, { label: 'Level 3 — Legal', count: l3, color: '#8B1A1A' }].map((l) => (
          <div key={l.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '16px 18px', borderLeft: `4px solid ${l.color}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 6 }}>{l.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: l.color }}>{isLoading ? '—' : l.count}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>client{l.count !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>Dunning Queue</div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', background: '#8B1A1A', cursor: 'pointer' }}>
              <SendOutlined /> Send All Reminders
            </button>
          </div>

          {isLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 4 }} /></div>}
          {!isLoading && queue.length === 0 && <div style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>No overdue accounts in queue</div>}

          {!isLoading && queue.map((d, i) => {
            const lvlStyle = LEVEL_COLORS[d.dunningLevel] ?? LEVEL_COLORS['L1']
            return (
              <div key={d.id} onClick={() => setSelectedId(selectedId === d.id ? null : d.id)} style={{ padding: '16px 20px', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB', cursor: 'pointer', background: selectedId === d.id ? 'rgba(139,26,26,0.03)' : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>{d.customerName}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Next action: {dayjs(d.nextActionDate).format('MMM DD, YYYY')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#8B1A1A' }}>{formatINR(d.outstandingAmount)}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: lvlStyle.bg, color: lvlStyle.color, marginTop: 4, display: 'inline-block' }}>
                      {d.dunningLevel}
                    </span>
                  </div>
                </div>
                {selectedId === d.id && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); handleSend(d.customerId, d.dunningLevel) }} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Send Now</button>
                    <button style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', color: '#334155', fontSize: 11, cursor: 'pointer' }}>View History</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a', marginBottom: 16 }}>Dunning Workflow</div>
          {[{ level: 'L1', label: 'Soft Reminder', days: '1-7 days', icon: '📧' }, { level: 'L2', label: 'Follow-up Call', days: '8-30 days', icon: '📞' }, { level: 'L3', label: 'Demand Letter', days: '31-60 days', icon: '📜' }, { level: 'L4', label: 'Legal Action', days: '60+ days', icon: '⚖️' }].map((s, i) => (
            <div key={s.level} style={{ display: 'flex', gap: 12, marginBottom: 16, position: 'relative' }}>
              {i < 3 && <div style={{ position: 'absolute', left: 15, top: 32, width: 2, height: 'calc(100% + 4px)', background: '#E8E0D8' }} />}
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, zIndex: 1 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2a4a' }}>{s.level} — {s.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.days} overdue</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
