interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  height?: number
  showLabel?: boolean
}

export default function ProgressBar({ value, max = 100, color = '#8B1A1A', height = 8, showLabel }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height, background: '#F1EDE8', borderRadius: height }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height, transition: 'width 0.3s' }} />
      </div>
      {showLabel && <span style={{ fontSize: 12, color: '#64748b', minWidth: 36 }}>{pct.toFixed(0)}%</span>}
    </div>
  )
}
