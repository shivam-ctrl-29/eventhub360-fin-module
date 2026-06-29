import { formatDateTime } from '@modules/finance/utils/dateFormatter'

export interface TimelineEntry {
  id: string
  timestamp: string
  user: string
  action: string
  description: string
  severity: 'info' | 'success' | 'warning' | 'error'
}

const SEVERITY_COLOR: Record<TimelineEntry['severity'], string> = {
  info: '#3b82f6',
  success: '#059669',
  warning: '#f59e0b',
  error: '#dc2626',
}

interface AuditTimelineProps {
  entries: TimelineEntry[]
}

export default function AuditTimeline({ entries }: AuditTimelineProps) {
  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      {entries.map((entry, i) => {
        const color = SEVERITY_COLOR[entry.severity]
        return (
          <div key={entry.id} style={{ position: 'relative', paddingBottom: 20 }}>
            <div style={{
              position: 'absolute', left: -24, top: 4,
              width: 12, height: 12, borderRadius: '50%',
              background: color, border: '2px solid #fff',
              boxShadow: `0 0 0 2px ${color}40`,
            }} />
            {i < entries.length - 1 && (
              <div style={{ position: 'absolute', left: -18, top: 16, bottom: 0, width: 1, background: '#E8E0D8' }} />
            )}
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>{entry.action}</div>
            <div style={{ fontSize: 13, color: '#64748b', margin: '2px 0' }}>{entry.description}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {entry.user} · {formatDateTime(entry.timestamp)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
