interface KPICardProps {
  title: string
  value: string
  subValue?: string
  badge?: string
  badgeColor?: string
  topBorderColor?: string
  icon?: string
}

export default function KPICard({ title, value, subValue, badge, badgeColor = '#059669', topBorderColor }: KPICardProps) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '18px 20px',
      borderTop: topBorderColor ? `4px solid ${topBorderColor}` : undefined,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1a2a4a', lineHeight: 1.2 }}>{value}</div>
      {subValue && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{subValue}</div>}
      {badge && (
        <span style={{
          display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 600,
          color: badgeColor, background: `${badgeColor}18`, padding: '2px 8px', borderRadius: 20,
        }}>{badge}</span>
      )}
    </div>
  )
}
