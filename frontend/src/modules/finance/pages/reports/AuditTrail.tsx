import { useState } from 'react'
import { useDebounce } from '@shared/hooks/useDebounce'
import { SearchOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons'
import { Skeleton, Alert } from 'antd'
import { useAuditTrail } from '../../hooks/usePnL'
import { usePermissions } from '@shared/hooks/usePermissions'
import dayjs from 'dayjs'

const SEVERITY_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  info:    { bg: '#DBEAFE', color: '#1E40AF', dot: '#1E40AF' },
  success: { bg: '#D1FAE5', color: '#065F46', dot: '#059669' },
  warning: { bg: '#FEF3C7', color: '#92400E', dot: '#C4A24D' },
  error:   { bg: '#FEE2E2', color: '#991B1B', dot: '#8B1A1A' },
}

export default function AuditTrail() {
  const { can } = usePermissions()
  const [localSearch, setLocalSearch] = useState('')
  const search = useDebounce(localSearch, 300)
  const [severityFilter, setSeverityFilter] = useState('')

  const { data: page, isLoading, isError } = useAuditTrail({
    page: 1,
    limit: 50,
    severity: severityFilter || undefined,
  })

  const logs = page?.data ?? []

  const filtered = search
    ? logs.filter((l) =>
        l.user.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entityId.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  if (!can('audit.view')) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Access Restricted</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>You do not have permission to view the Audit Trail.</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Audit Trail Viewer</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Complete immutable log of all financial actions and system events</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E8E0D8', borderRadius: 8, padding: '7px 12px', width: 240 }}>
            <SearchOutlined style={{ color: '#94a3b8', fontSize: 13 }} />
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search logs..." style={{ border: 'none', outline: 'none', fontSize: 12, background: 'transparent', width: '100%', color: '#334155' }} />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', fontSize: 12, color: '#334155', cursor: 'pointer' }}>
            <DownloadOutlined /> Export
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['All', 'info', 'success', 'warning', 'error'].map((s) => (
          <button key={s} onClick={() => setSeverityFilter(s === 'All' ? '' : s)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #E8E0D8', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: (s === 'All' ? '' : s) === severityFilter ? '#8B1A1A' : '#fff', color: (s === 'All' ? '' : s) === severityFilter ? '#fff' : '#64748b', textTransform: 'capitalize' }}>
            {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
          <FilterOutlined /> Showing {filtered.length} {page?.total ? `of ${page.total}` : ''} entries
        </div>
      </div>

      {isError && <Alert type="error" message="Failed to load audit trail." style={{ marginBottom: 16 }} />}

      {isLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 8 }} /></div>}

      {!isLoading && (
        <div style={{ position: 'relative', paddingLeft: 28 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: '#E8E0D8' }} />
          {filtered.map((log) => {
            const style = SEVERITY_STYLE[log.severity] ?? SEVERITY_STYLE['info']
            return (
              <div key={log.id} style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ position: 'absolute', left: -21, top: 16, width: 12, height: 12, borderRadius: '50%', background: style.dot, border: '2px solid #fff', boxShadow: `0 0 0 2px ${style.dot}40` }} />
                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8E0D8', padding: '14px 18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px 100px 90px', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {dayjs(log.timestamp).format('MMM DD, YYYY HH:mm')}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2a4a', marginBottom: 2 }}>{log.action}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{log.description}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#8B1A1A', fontFamily: 'monospace' }}>{log.entityId}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{log.user}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: style.bg, color: style.color, textAlign: 'center', textTransform: 'capitalize' }}>
                      {log.severity}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
              No audit logs match your search.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
