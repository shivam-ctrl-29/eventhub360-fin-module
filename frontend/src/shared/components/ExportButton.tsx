interface ExportButtonProps {
  onExport: () => void
  label?: string
  disabled?: boolean
}

export default function ExportButton({ onExport, label = 'Export', disabled }: ExportButtonProps) {
  return (
    <button
      onClick={onExport}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', fontSize: 13, fontWeight: 600,
        border: '1px solid #E8E0D8', borderRadius: 8,
        background: '#fff', color: '#334155', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      ↓ {label}
    </button>
  )
}
