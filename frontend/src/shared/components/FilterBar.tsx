interface FilterOption {
  label: string
  value: string
  count?: number
}

interface FilterBarProps {
  options: FilterOption[]
  active: string
  onChange: (value: string) => void
}

export default function FilterBar({ options, active, onChange }: FilterBarProps) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const isActive = active === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '6px 14px', fontSize: 13, fontWeight: isActive ? 700 : 500,
              borderRadius: 20, border: 'none', cursor: 'pointer',
              background: isActive ? '#8B1A1A' : '#F1EDE8',
              color: isActive ? '#fff' : '#64748b',
            }}
          >
            {opt.label}{opt.count !== undefined ? ` (${opt.count})` : ''}
          </button>
        )
      })}
    </div>
  )
}
