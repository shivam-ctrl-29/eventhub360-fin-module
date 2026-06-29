interface CircularGaugeProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export default function CircularGauge({ value, max = 100, size = 120, strokeWidth = 10, color = '#059669', label }: CircularGaugeProps) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.min(1, value / max)
  const dash = pct * circumference

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1EDE8" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x={size / 2} y={size / 2 + 2} textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.18} fontWeight="700" fill="#1a2a4a">
          {value}
        </text>
      </svg>
      {label && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>}
    </div>
  )
}
