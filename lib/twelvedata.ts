// lib/twelvedata.ts — Gold trading data with Twelve Data ONLY

const TWELVEDATA_KEY = () => process.env.TWELVEDATA_API_KEY
const TWELVEDATA_BASE = 'https://api.twelvedata.com'
const PROVIDER_TIMEOUT_MS = clampInt(process.env.PROVIDER_TIMEOUT_MS, 4_500, 1_000, 20_000)
const PROVIDER_MAX_RETRIES = clampInt(process.env.PROVIDER_MAX_RETRIES, 1, 0, 3)
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(raw ?? '', 10)
  if (!Number.isFinite(parsed)) return fallback
  if (parsed < min) return min
  if (parsed > max) return max
  return parsed
}

// ─────────────────────────────────────────────────────────────────────────────
// Gold detection: Check if symbol is XAU/USD (gold commodity)
// ─────────────────────────────────────────────────────────────────────────────
function isGoldSymbol(symbol: string): boolean {
  const normalized = normalizeSymbol(symbol)
  return normalized === 'XAU/USD'
}

export interface Quote {
  symbol: string
  close: number
  change: number
  percent_change: number
  high: number
  low: number
  open: number
  volume: number
  fifty_two_week: { low: number; high: number }
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type DataProvider = 'twelvedata' | 'synthetic'

interface CandleCacheEntry {
  candles: Candle[]
  fetchedAt: number
}

const candleCache = new Map<string, CandleCacheEntry>()

function normalizeSymbol(symbol: string): string {
  const cleaned = (symbol ?? '').trim().toUpperCase().replace(/[-_\s]/g, '')
  if (cleaned === 'GOLD' || cleaned === 'XAUUSD' || cleaned === 'XAUUS$') {
    return 'XAU/USD'
  }
  if (cleaned === 'XAU/USD'.replace('/', '')) {
    return 'XAU/USD'
  }
  return symbol?.includes('/') ? symbol.toUpperCase() : symbol
}

// ─────────────────────────────────────────────────────────────────────────────
// GoldAPI integration: Build candles from daily historical spot prices
// ─────────────────────────────────────────────────────────────────────────────
// Twelve Data integration: Accurate gold spot prices + candles
// ─────────────────────────────────────────────────────────────────────────────
async function fetchTwelveData(endpoint: string, params: Record<string, string>) {
  const key = TWELVEDATA_KEY()
  if (!key) {
    throw new Error('Missing TWELVEDATA_API_KEY')
  }

  const url = new URL(`${TWELVEDATA_BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))
  url.searchParams.append('apikey', key)

  const data = await fetchJsonWithRetry(url.toString())
  if (data?.status === 'error') {
    throw new Error(`Twelve Data API error: ${data.message || 'Unknown error'}`)
  }
  return data
}

async function fetchTwelveDataQuote(symbol: string): Promise<Quote> {
  const canonical = normalizeSymbol(symbol)
  const [from = 'XAU', to = 'USD'] = canonical.split('/')
  
  const data = await fetchTwelveData('quote', {
    symbol: `${from}/${to}`,
    exchange: 'COMEX'
  })

  const close = Number(data?.close)
  const change = Number(data?.change)
  const percentChange = Number(data?.percent_change)
  const high = Number(data?.high)
  const low = Number(data?.low)
  const open = Number(data?.open)

  if (!Number.isFinite(close) || close <= 0) {
    throw new Error('Twelve Data quote error: invalid price')
  }

  return {
    symbol: canonical,
    close,
    change: Number.isFinite(change) ? change : 0,
    percent_change: Number.isFinite(percentChange) ? percentChange : 0,
    high: Number.isFinite(high) ? high : close,
    low: Number.isFinite(low) ? low : close,
    open: Number.isFinite(open) ? open : close,
    volume: 0,
    fifty_two_week: {
      low: Number.isFinite(low) ? low : close * 0.9,
      high: Number.isFinite(high) ? high : close * 1.1
    }
  }
}

async function fetchTwelveDataCandles(symbol: string, interval: string, count: number): Promise<Candle[]> {
  const canonical = normalizeSymbol(symbol)
  const [from = 'XAU', to = 'USD'] = canonical.split('/')
  const cacheKey = `${canonical}:${interval}:${count}`
  const cached = candleCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt <= getCacheTtlMs(interval)) return cached.candles

  const twelveDataInterval = interval === '15min' ? '15min' : interval === '1h' ? '1h' : interval === '4h' ? '4h' : '1day'
  
  const data = await fetchTwelveData('time_series', {
    symbol: `${from}/${to}`,
    interval: twelveDataInterval,
    outputsize: String(Math.min(count * 2, 5000)),
    exchange: 'COMEX'
  })

  const values = Array.isArray(data?.values) ? data.values : []
  const candles: Candle[] = values
    .map((bar: any) => ({
      time: Math.floor(new Date(bar.datetime).getTime() / 1000),
      open: Number(bar.open),
      high: Number(bar.high),
      low: Number(bar.low),
      close: Number(bar.close),
      volume: Number(bar.volume ?? 0)
    }))
    .filter((c: Candle) => Number.isFinite(c.open) && Number.isFinite(c.high) && Number.isFinite(c.low) && Number.isFinite(c.close))
    .sort((a: Candle, b: Candle) => a.time - b.time)

  const finalCandles = candles.slice(-count)
  if (finalCandles.length === 0) {
    throw new Error('Twelve Data API error: No candle data returned')
  }

  candleCache.set(cacheKey, { candles: finalCandles, fetchedAt: Date.now() })
  return finalCandles
}

function getCacheTtlMs(interval: string): number {
  if (interval === '1day') return 5 * 60_000
  return 45_000
}

function parseSymbol(symbol: string): { from: string; to: string } {
  const canonical = normalizeSymbol(symbol)
  const [from = 'XAU', to = 'USD'] = canonical.split('/')
  return { from, to }
}

// Helper functions for utilities (resampling, retry logic)

// Removed: fetchFinnhubQuote() - using Twelve Data only

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return true
    if (error.message.includes('fetch failed')) return true
    if (error.message.includes('network')) return true
    for (const code of RETRYABLE_STATUS) {
      if (error.message.includes(` ${code}`)) return true
    }
  }
  return false
}

async function fetchJsonWithRetry(url: string): Promise<any> {
  let lastError: unknown

  for (let attempt = 0; attempt <= PROVIDER_MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

    try {
      const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      return await res.json()
    } catch (error) {
      lastError = error
      const shouldRetry = attempt < PROVIDER_MAX_RETRIES && isRetryableError(error)
      if (!shouldRetry) break
      await sleep(150 * (attempt + 1))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown provider fetch error')
}

// Removed: fetchAlpha(), fetchMarketstack(), fetchFinnhub() - using Twelve Data + GoldAPI only

// Removed: parseAlphaSeries(), resampleTo4h(), parseMarketstackRows(), parseFinnhubCandles() - using Twelve Data native interval support

// Removed: fetchAlphaCandles(), fetchMarketstackCandles(), fetchFinnhubCandles() - using Twelve Data + GoldAPI only

function quoteFromCandles(symbol: string, candles: Candle[]): Quote {
  const last = candles[candles.length - 1]
  const prev = candles[candles.length - 2] ?? last
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  
  // Use realistic fallback prices for gold
  const isGold = isGoldSymbol(symbol)
  const fallbackPrice = isGold ? 5180 : 2650
  
  const change = (last?.close ?? fallbackPrice) - (prev?.close ?? fallbackPrice)
  const percentChange = prev?.close ? (change / prev.close) * 100 : 0

  return {
    symbol,
    close: last?.close ?? fallbackPrice,
    change,
    percent_change: percentChange,
    high: last?.high ?? (fallbackPrice + 20),
    low: last?.low ?? (fallbackPrice - 20),
    open: last?.open ?? fallbackPrice,
    volume: last?.volume ?? 0,
    fifty_two_week: {
      low: lows.length ? Math.min(...lows) : (fallbackPrice - 200),
      high: highs.length ? Math.max(...highs) : (fallbackPrice + 200)
    }
  }
}

function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0
  const slice = values.slice(-period)
  return slice.reduce((sum, v) => sum + v, 0) / period
}

function stdDev(values: number[], period: number): number {
  if (values.length < period) return 0
  const slice = values.slice(-period)
  const mean = slice.reduce((sum, v) => sum + v, 0) / period
  const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period
  return Math.sqrt(variance)
}

function emaSeries(values: number[], period: number): number[] {
  if (values.length === 0) return []
  const k = 2 / (period + 1)
  const result: number[] = []
  let prev = values[0]
  result.push(prev)
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    result.push(prev)
  }
  return result
}

function calculateRSI(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 50
  let gains = 0
  let losses = 0
  for (let i = candles.length - period; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close
    if (change >= 0) gains += change
    else losses += Math.abs(change)
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function calculateMACD(candles: Candle[]): { macd: number; signal: number; histogram: number } {
  const closes = candles.map(c => c.close)
  if (closes.length < 35) return { macd: 0, signal: 0, histogram: 0 }
  const ema12 = emaSeries(closes, 12)
  const ema26 = emaSeries(closes, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signalLine = emaSeries(macdLine, 9)
  const macd = macdLine[macdLine.length - 1] ?? 0
  const signal = signalLine[signalLine.length - 1] ?? 0
  return { macd, signal, histogram: macd - signal }
}

function calculateBBands(candles: Candle[]): { upper: number; middle: number; lower: number } {
  const closes = candles.map(c => c.close)
  if (closes.length < 20) {
    const last = closes[closes.length - 1] ?? 5180
    return { upper: last + 50, middle: last, lower: last - 50 }
  }
  const middle = sma(closes, 20)
  const sd = stdDev(closes, 20)
  return { upper: middle + 2 * sd, middle, lower: middle - 2 * sd }
}

function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 15
  const trs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const highLow = candles[i].high - candles[i].low
    const highPrevClose = Math.abs(candles[i].high - candles[i - 1].close)
    const lowPrevClose = Math.abs(candles[i].low - candles[i - 1].close)
    trs.push(Math.max(highLow, highPrevClose, lowPrevClose))
  }
  const tail = trs.slice(-period)
  return tail.reduce((sum, v) => sum + v, 0) / period
}

export async function fetchQuoteWithProvider(symbol: string): Promise<{ quote: Quote; provider: DataProvider }> {
  const canonical = normalizeSymbol(symbol)

  // ✓ PRIMARY: Twelve Data (accurate real-time gold prices)
  if (TWELVEDATA_KEY()) {
    try {
      const quote = await fetchTwelveDataQuote(canonical)
      console.log(`[twelvedata] Quote fetched: ${quote.close}`)
      return { quote, provider: 'twelvedata' }
    } catch (error) {
      console.warn('[twelvedata] Quote failed, using synthetic fallback:', error)
    }
  }

  // ✓ FALLBACK: Synthetic data with realistic gold prices
  const fallbackPrice = isGoldSymbol(canonical) ? 5180 : 2650
  console.warn(`[synthetic] Using fallback price: ${fallbackPrice}`)
  return { quote: quoteFromCandles(canonical, generateMockCandles(260, fallbackPrice)), provider: 'synthetic' }
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const { quote } = await fetchQuoteWithProvider(symbol)
  return quote
}

export async function fetchCandlesWithProvider(symbol: string, interval: string, count: number): Promise<{ candles: Candle[]; provider: DataProvider }> {
  const canonical = normalizeSymbol(symbol)

  // ✓ PRIMARY: Twelve Data (accurate OHLCV candles for all intervals)
  if (TWELVEDATA_KEY()) {
    try {
      const candles = await fetchTwelveDataCandles(canonical, interval, count)
      if (candles.length > 0) {
        console.log(`[twelvedata] Fetched ${candles.length} candles for ${canonical} @ ${interval}`)
        return { candles, provider: 'twelvedata' }
      }
    } catch (error) {
      console.warn('[twelvedata] Candles failed, using synthetic fallback:', error)
    }
  }

  // ✓ FALLBACK: Synthetic data with realistic gold prices
  const fallbackPrice = isGoldSymbol(canonical) ? 5180 : 2650
  console.warn(`[synthetic] Generating ${count} mock candles at ${fallbackPrice}`)
  return { candles: generateMockCandles(count, fallbackPrice), provider: 'synthetic' }
}

export async function fetchCandles(symbol: string, interval: string, count: number): Promise<Candle[]> {
  const { candles } = await fetchCandlesWithProvider(symbol, interval, count)
  return candles
}

export async function fetchRSI(symbol: string, interval: string): Promise<number> {
  try {
    const candles = await fetchCandles(symbol, interval, 160)
    return calculateRSI(candles)
  } catch {
    return 50
  }
}

export async function fetchMACD(symbol: string, interval: string): Promise<{ macd: number; signal: number; histogram: number }> {
  try {
    const candles = await fetchCandles(symbol, interval, 200)
    return calculateMACD(candles)
  } catch {
    return { macd: 0, signal: 0, histogram: 0 }
  }
}

export async function fetchBBands(symbol: string, interval: string): Promise<{ upper: number; middle: number; lower: number }> {
  try {
    const candles = await fetchCandles(symbol, interval, 200)
    return calculateBBands(candles)
  } catch {
    // Fallback to realistic gold prices if fetch fails
    const isGold = isGoldSymbol(symbol)
    const basePrice = isGold ? 5180 : 2650
    return { upper: basePrice + 50, middle: basePrice, lower: basePrice - 50 }
  }
}

export async function fetchATR(symbol: string, interval: string): Promise<number> {
  try {
    const candles = await fetchCandles(symbol, interval, 200)
    return calculateATR(candles)
  } catch {
    return 15
  }
}

function generateMockCandles(count: number, basePrice: number): Candle[] {
  const candles: Candle[] = []
  const now = Math.floor(Date.now() / 1000)
  const interval = 3600 // 1 hour
  
  for (let i = count - 1; i >= 0; i--) {
    const volatility = 20
    const open = basePrice + (Math.random() - 0.5) * volatility
    const close = open + (Math.random() - 0.5) * volatility / 2
    const high = Math.max(open, close) + Math.random() * volatility / 3
    const low = Math.min(open, close) - Math.random() * volatility / 3
    
    candles.push({
      time: now - (i * interval),
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000
    })
  }
  
  return candles
}
