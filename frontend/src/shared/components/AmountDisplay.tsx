import { formatINR } from '@modules/finance/utils/currencyFormatter'

interface AmountDisplayProps {
  amount: number
  compact?: boolean
  className?: string
  style?: React.CSSProperties
  positive?: boolean
  negative?: boolean
}

export default function AmountDisplay({ amount, compact, style, positive, negative }: AmountDisplayProps) {
  const color = positive ? '#059669' : negative ? '#dc2626' : undefined
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', color, ...style }}>
      {formatINR(amount, { compact })}
    </span>
  )
}
