import { Injectable, Logger } from '@nestjs/common'

export interface RateCache {
  base: 'INR'
  rates: Record<string, number>
  fetchedAt: string
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
const SUPPORTED = ['USD', 'EUR', 'KWD']

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name)
  private cache: RateCache | null = null
  private cachedAt = 0

  async getRates(): Promise<RateCache> {
    const now = Date.now()
    if (this.cache && now - this.cachedAt < CACHE_TTL_MS) {
      return this.cache
    }

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/INR')
      if (!res.ok) throw new Error(`FX API responded ${res.status}`)
      const json = (await res.json()) as { result: string; rates: Record<string, number> }
      if (json.result !== 'success') throw new Error('FX API returned non-success result')

      const rates: Record<string, number> = {}
      for (const code of SUPPORTED) {
        if (typeof json.rates[code] === 'number') rates[code] = json.rates[code]
      }

      this.cache = { base: 'INR', rates, fetchedAt: new Date().toISOString() }
      this.cachedAt = now
      return this.cache
    } catch (err) {
      this.logger.warn(`Live FX rate fetch failed: ${(err as Error).message}`)
      // Serve the last known-good cache rather than a fabricated rate, even if stale.
      if (this.cache) return this.cache
      // No live data has ever been fetched — be honest about it rather than guessing.
      return { base: 'INR', rates: {}, fetchedAt: new Date(0).toISOString() }
    }
  }
}
