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

function activeCurrency(): CurrencyConfig {
  return CURRENCY_CONFIG[useFinanceUIStore.getState().currency] ?? CURRENCY_CONFIG.INR
}

// Currency-aware money formatter. Honours the globally selected currency
// (symbol + decimals + locale). No FX conversion — the numeric value is unchanged.
export function formatINR(amount: number, options?: { compact?: boolean; showSymbol?: boolean }): string {
  const { compact = false, showSymbol = true } = options ?? {}
  const cfg = activeCurrency()
  const sym = showSymbol ? cfg.symbol : ''
  const n = Number(amount) || 0

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
