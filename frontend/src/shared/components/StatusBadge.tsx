interface StatusBadgeProps {
  label: string
  color: string
  background?: string
}

export default function StatusBadge({ label, color, background }: StatusBadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, color,
      background: background ?? `${color}18`,
      padding: '3px 10px', borderRadius: 20,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  )
}
