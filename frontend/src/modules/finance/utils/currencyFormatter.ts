import { useFinanceUIStore, type CurrencyCode } from '../store/financeUIStore'

interface CurrencyConfig {
  symbol: string
  decimals: number
  locale: string
  compactStyle: 'indian' | 'western'
}

export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
  INR: { symbol: '₹',  decimals: 2, locale: 'en-IN', compactStyle: 'indian' },
  USD: { symbol: '$',  decimals: 2, locale: 'en-US', compactStyle: 'western' },
  EUR: { symbol: '€',  decimals: 2, locale: 'en-IE', compactStyle: 'western' },
  KWD: { symbol: 'KD ', decimals: 3, locale: 'en-US', compactStyle: 'western' },
}

export const CURRENCY_OPTIONS: Array<{ value: CurrencyCode; label: string }> = [
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'KWD', label: 'KD KWD' },
]

function activeCurrency(): CurrencyCode {
  return useFinanceUIStore.getState().currency
}

// Currency-aware money formatter. Converts using live exchange rates fetched
// from the backend (see useExchangeRates) — never a hardcoded/invented rate.
// Until rates have loaded at least once, falls back to INR (the true source
// value) rather than showing a non-INR symbol next to an unconverted number.
export function formatINR(amount: number, options?: { compact?: boolean; showSymbol?: boolean }): string {
  const { compact = false, showSymbol = true } = options ?? {}
  const selected = activeCurrency()
  const { rates } = useFinanceUIStore.getState()

  const rate = selected === 'INR' ? 1 : rates?.[selected]
  // No live rate available yet for a non-INR selection — show the real INR
  // value rather than fabricate a 1:1 "conversion".
  const code: CurrencyCode = rate !== undefined ? selected : 'INR'
  const cfg = CURRENCY_CONFIG[code]
  const sym = showSymbol ? cfg.symbol : ''
  const n = (Number(amount) || 0) * (code === 'INR' ? 1 : (rate as number))

  if (compact) {
    const abs = Math.abs(n)
    if (cfg.compactStyle === 'indian') {
      if (abs >= 10_000_000) return `${sym}${(n / 10_000_000).toFixed(2)}Cr`
      if (abs >= 100_000)    return `${sym}${(n / 100_000).toFixed(2)}L`
      if (abs >= 1_000)      return `${sym}${(n / 1_000).toFixed(1)}K`
    } else {
      if (abs >= 1_000_000)  return `${sym}${(n / 1_000_000).toFixed(2)}M`
      if (abs >= 1_000)      return `${sym}${(n / 1_000).toFixed(1)}K`
    }
  }

  const formatted = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(n)

  return `${sym}${formatted}`
}

export function parseINR(value: string): number {
  return parseFloat(value.replace(/[₹$€,\sKD]/g, '')) || 0
}
