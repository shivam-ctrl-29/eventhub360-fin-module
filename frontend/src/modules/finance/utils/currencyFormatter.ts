export function formatINR(amount: number, options?: { compact?: boolean; showSymbol?: boolean }): string {
  const { compact = false, showSymbol = true } = options ?? {}

  if (compact) {
    if (Math.abs(amount) >= 10_000_000) {
      return `${showSymbol ? '₹' : ''}${(amount / 10_000_000).toFixed(2)}Cr`
    }
    if (Math.abs(amount) >= 100_000) {
      return `${showSymbol ? '₹' : ''}${(amount / 100_000).toFixed(2)}L`
    }
    if (Math.abs(amount) >= 1_000) {
      return `${showSymbol ? '₹' : ''}${(amount / 1_000).toFixed(1)}K`
    }
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount)

  return formatted
}

export function parseINR(value: string): number {
  return parseFloat(value.replace(/[₹,\s]/g, '')) || 0
}
