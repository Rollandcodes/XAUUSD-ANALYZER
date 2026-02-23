// lib/twelvedata.ts — Market data integration with GoldAPI as primary for commodities
import { fetchGoldSpot, fetchGoldWeekHistory, type GoldSpot, type GoldHistorical } from './goldapi'

const ALPHA_KEY = () => process.env.ALPHAVANTAGE_API_KEY
const MARKETSTACK_KEY = () => process.env.MARKETSTACK_API_KEY
const FINNHUB_KEY = () => process.env.FINNHUB_API_KEY
const GOLDAPI_KEY = () => process.env.GOLDAPI_KEY
const ALPHA_BASE = 'https://www.alphavantage.co/query'
const MARKETSTACK_BASE = 'https://api.marketstack.com/v1'
const FINNHUB_BASE = 'https://finnhub.io/api/v1'
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

export type DataProvider = 'goldapi' | 'alpha_vantage' | 'marketstack' | 'finnhub' | 'synthetic'

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
async function buildCandlesFromGoldAPI(count: number): Promise<Candle[]> {
  try {
    const history = await fetchGoldWeekHistory()
    if (!history || history.length === 0) return []

    const candles: Candle[] = history.map((h, idx) => {
      const dateStr = h.date || ''
      const date = new Date(
        dateStr.slice(0, 4) + '-' + dateStr.slice(4, 6) + '-' + dateStr.slice(6, 8)
      )
      const time = Math.floor(date.getTime() / 1000)
      
      return {
        time,
        open: h.price,
        high: h.ask || h.price,
        low: h.bid || h.price,
        close: h.price,
        volume: 0
      }
    })

    return candles.slice(-Math.min(count, candles.length))
  } catch (error) {
    console.warn('[goldapi] Failed to build candles from history:', error)
    return []
  }
}

async function quoteFromGoldAPI(symbol: string): Promise<Quote | null> {
  try {
    const spot = await fetchGoldSpot()
    if (!spot) return null

    return {
      symbol: normalizeSymbol(symbol),
      close: spot.price,
      change: spot.ch,
      percent_change: spot.chp,
      high: spot.ask,
      low: spot.bid,
      open: spot.prev_close_price,
      volume: 0,
      fifty_two_week: {
        low: spot.bid,
        high: spot.ask
      }
    }
  } catch (error) {
    console.warn('[goldapi] Failed to fetch quote:', error)
    return null
  }
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

function mapIntervalToAlpha(interval: string): '15min' | '60min' | '1day' {
  if (interval === '15min') return '15min'
  if (interval === '1h') return '60min'
  if (interval === '4h') return '60min'
  return '1day'
}

function mapIntervalToMarketstack(interval: string): { endpoint: 'eod' | 'intraday'; msInterval?: string } {
  if (interval === '1day') return { endpoint: 'eod' }
  if (interval === '15min') return { endpoint: 'intraday', msInterval: '15min' }
  return { endpoint: 'intraday', msInterval: '1hour' }
}

function mapIntervalToFinnhub(interval: string): { resolution: '15' | '60' | 'D'; baseSeconds: number } {
  if (interval === '15min') return { resolution: '15', baseSeconds: 15 * 60 }
  if (interval === '1h') return { resolution: '60', baseSeconds: 60 * 60 }
  if (interval === '4h') return { resolution: '60', baseSeconds: 60 * 60 }
  return { resolution: 'D', baseSeconds: 24 * 60 * 60 }
}

function toFinnhubSymbol(symbol: string): string {
  const canonical = normalizeSymbol(symbol)
  const [from = 'XAU', to = 'USD'] = canonical.split('/')
  return `OANDA:${from}_${to}`
}

async function fetchFinnhubQuote(symbol: string): Promise<Quote> {
  const data = await fetchFinnhub('quote', {
    symbol: toFinnhubSymbol(symbol)
  })

  const close = Number(data?.c)
  const high = Number(data?.h)
  const low = Number(data?.l)
  const open = Number(data?.o)
  const prevClose = Number(data?.pc)
  const change = Number.isFinite(Number(data?.d)) ? Number(data?.d) : close - prevClose
  const percentChange = Number.isFinite(Number(data?.dp)) && Number(data?.dp) !== 0
    ? Number(data?.dp)
    : (prevClose ? (change / prevClose) * 100 : 0)

  if (!Number.isFinite(close) || close <= 0) {
    throw new Error('Finnhub quote error: invalid quote payload')
  }

  return {
    symbol: normalizeSymbol(symbol) || 'XAU/USD',
    close,
    change: Number.isFinite(change) ? change : 0,
    percent_change: Number.isFinite(percentChange) ? percentChange : 0,
    high: Number.isFinite(high) ? high : close,
    low: Number.isFinite(low) ? low : close,
    open: Number.isFinite(open) ? open : close,
    volume: 0,
    fifty_two_week: {
      low: Number.isFinite(low) ? Math.min(low, close) : close,
      high: Number.isFinite(high) ? Math.max(high, close) : close
    }
  }
}

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

async function fetchAlpha(params: Record<string, string>) {
  const key = ALPHA_KEY()
  if (!key) {
    throw new Error('Missing ALPHAVANTAGE_API_KEY')
  }

  const url = new URL(ALPHA_BASE)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))
  url.searchParams.append('apikey', key)

  const data = await fetchJsonWithRetry(url.toString())
  if (data?.ErrorMessage) {
    throw new Error(`Alpha Vantage API error: ${data.ErrorMessage}`)
  }
  if (data?.Information || data?.Note) {
    throw new Error(`Alpha Vantage API error: ${data.Information ?? data.Note}`)
  }
  return data
}

async function fetchMarketstack(endpoint: 'eod' | 'intraday', params: Record<string, string>) {
  const key = MARKETSTACK_KEY()
  if (!key) {
    throw new Error('Missing MARKETSTACK_API_KEY')
  }

  const url = new URL(`${MARKETSTACK_BASE}/${endpoint}`)
  url.searchParams.append('access_key', key)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))

  const data = await fetchJsonWithRetry(url.toString())
  if (data?.error) {
    const message = data?.error?.message ?? data?.error?.code ?? 'Unknown error'
    throw new Error(`Marketstack API error: ${message}`)
  }

  return data
}

async function fetchFinnhub(endpoint: string, params: Record<string, string>) {
  const key = FINNHUB_KEY()
  if (!key) {
    throw new Error('Missing FINNHUB_API_KEY')
  }

  const url = new URL(`${FINNHUB_BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))
  url.searchParams.append('token', key)

  const data = await fetchJsonWithRetry(url.toString())
  if (data?.error) {
    throw new Error(`Finnhub API error: ${data.error}`)
  }

  return data
}

function parseAlphaSeries(data: any, interval: '15min' | '60min' | '1day'): Candle[] {
  const seriesKey =
    interval === '1day'
      ? 'Time Series FX (Daily)'
      : `Time Series FX (${interval})`

  const series = data?.[seriesKey]
  if (!series || typeof series !== 'object') {
    return []
  }

  return Object.entries(series)
    .map(([datetime, values]: any) => ({
      time: Math.floor(new Date(datetime).getTime() / 1000),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: 0
    }))
    .sort((a, b) => a.time - b.time)
}

function resampleTo4h(candles: Candle[]): Candle[] {
  if (candles.length === 0) return candles

  const buckets = new Map<number, Candle[]>()
  for (const c of candles) {
    const bucket = Math.floor(c.time / (4 * 3600)) * (4 * 3600)
    if (!buckets.has(bucket)) buckets.set(bucket, [])
    buckets.get(bucket)!.push(c)
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([time, group]) => ({
      time,
      open: group[0].open,
      high: Math.max(...group.map(g => g.high)),
      low: Math.min(...group.map(g => g.low)),
      close: group[group.length - 1].close,
      volume: 0
    }))
}

function parseMarketstackRows(rows: any[]): Candle[] {
  return rows
    .map((row: any) => ({
      time: Math.floor(new Date(row.date).getTime() / 1000),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume ?? 0)
    }))
    .filter((c: Candle) => Number.isFinite(c.open) && Number.isFinite(c.high) && Number.isFinite(c.low) && Number.isFinite(c.close))
    .sort((a: Candle, b: Candle) => a.time - b.time)
}

function parseFinnhubCandles(data: any): Candle[] {
  if (!data || data.s !== 'ok') {
    return []
  }

  const t: number[] = data.t ?? []
  const o: number[] = data.o ?? []
  const h: number[] = data.h ?? []
  const l: number[] = data.l ?? []
  const c: number[] = data.c ?? []
  const v: number[] = data.v ?? []

  const size = Math.min(t.length, o.length, h.length, l.length, c.length)
  const candles: Candle[] = []
  for (let i = 0; i < size; i++) {
    const candle: Candle = {
      time: Number(t[i]),
      open: Number(o[i]),
      high: Number(h[i]),
      low: Number(l[i]),
      close: Number(c[i]),
      volume: Number(v[i] ?? 0)
    }

    if (Number.isFinite(candle.open) && Number.isFinite(candle.high) && Number.isFinite(candle.low) && Number.isFinite(candle.close)) {
      candles.push(candle)
    }
  }

  return candles.sort((a, b) => a.time - b.time)
}

async function fetchAlphaCandles(symbol: string, interval: string, count: number): Promise<Candle[]> {
  const canonical = normalizeSymbol(symbol)
  const cacheKey = `${canonical}:${interval}:${count}`
  const cached = candleCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt <= getCacheTtlMs(interval)) return cached.candles

  const { from, to } = parseSymbol(canonical)
  const mapped = mapIntervalToAlpha(interval)
  let params: Record<string, string>
  if (mapped === '1day') {
    params = {
      function: 'FX_DAILY',
      from_symbol: from,
      to_symbol: to,
      outputsize: 'full'
    }
  } else {
    params = {
      function: 'FX_INTRADAY',
      from_symbol: from,
      to_symbol: to,
      interval: mapped,
      outputsize: 'full'
    }
  }

  const data = await fetchAlpha(params)
  let candles = parseAlphaSeries(data, mapped)

  if (interval === '4h') {
    candles = resampleTo4h(candles)
  }

  const finalCandles = candles.slice(-count)
  candleCache.set(cacheKey, { candles: finalCandles, fetchedAt: Date.now() })
  return finalCandles
}

async function fetchMarketstackCandles(symbol: string, interval: string, count: number): Promise<Candle[]> {
  const ticker = symbol.replace('/', '')
  const { endpoint, msInterval } = mapIntervalToMarketstack(interval)

  const params: Record<string, string> = {
    symbols: ticker,
    limit: String(Math.max(count * 3, count))
  }

  if (endpoint === 'intraday' && msInterval) {
    params.interval = msInterval
  }

  const data = await fetchMarketstack(endpoint, params)
  const rows = Array.isArray(data?.data) ? data.data : []
  let candles = parseMarketstackRows(rows)

  if (interval === '4h') {
    candles = resampleTo4h(candles)
  }

  const finalCandles = candles.slice(-count)
  if (finalCandles.length === 0) {
    throw new Error('Marketstack API error: No candle data returned')
  }

  return finalCandles
}

async function fetchFinnhubCandles(symbol: string, interval: string, count: number): Promise<Candle[]> {
  const { resolution, baseSeconds } = mapIntervalToFinnhub(interval)
  const now = Math.floor(Date.now() / 1000)
  const multiplier = interval === '4h' ? 4 : 1
  const lookbackSeconds = Math.max(count * baseSeconds * multiplier * 3, 14 * 24 * 60 * 60)
  const from = now - lookbackSeconds

  const data = await fetchFinnhub('forex/candle', {
    symbol: toFinnhubSymbol(symbol),
    resolution,
    from: String(from),
    to: String(now)
  })

  let candles = parseFinnhubCandles(data)
  if (interval === '4h') {
    candles = resampleTo4h(candles)
  }

  const finalCandles = candles.slice(-count)
  if (!finalCandles.length) {
    throw new Error('Finnhub API error: No candle data returned')
  }

  return finalCandles
}

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

  // ✓ For gold commodities, use GoldAPI as primary source
  if (isGoldSymbol(canonical) && GOLDAPI_KEY()) {
    try {
      const quote = await quoteFromGoldAPI(canonical)
      if (quote) return { quote, provider: 'goldapi' }
    } catch (error) {
      console.warn('[data provider] GoldAPI quote failed:', error)
    }
  }

  if (FINNHUB_KEY()) {
    try {
      const quote = await fetchFinnhubQuote(canonical)
      return { quote, provider: 'finnhub' }
    } catch (error) {
      console.warn('[data provider] Finnhub realtime quote failed, trying fallback:', error)
    }
  }

  if (ALPHA_KEY()) {
    try {
      const candles = await fetchAlphaCandles(canonical, '15min', 260)
      if (candles.length) return { quote: quoteFromCandles(canonical, candles), provider: 'alpha_vantage' }
    } catch (error) {
      console.warn('[data provider] Alpha Vantage quote failed, trying fallback:', error)
    }
  }

  if (MARKETSTACK_KEY()) {
    try {
      const candles = await fetchMarketstackCandles(canonical, '1h', 260)
      if (candles.length) return { quote: quoteFromCandles(canonical, candles), provider: 'marketstack' }
    } catch (error) {
      console.warn('[data provider] Marketstack quote failed, trying fallback:', error)
    }
  }

  // Fallback to synthetic only if gold and GoldAPI not available
  const fallbackPrice = isGoldSymbol(canonical) ? 5180 : 2650
  return { quote: quoteFromCandles(canonical, generateMockCandles(260, fallbackPrice)), provider: 'synthetic' }
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const { quote } = await fetchQuoteWithProvider(symbol)
  return quote
}

export async function fetchCandlesWithProvider(symbol: string, interval: string, count: number): Promise<{ candles: Candle[]; provider: DataProvider }> {
  const canonical = normalizeSymbol(symbol)

  // ✓ For gold commodities, use GoldAPI as primary source (free tier: 100 req/month)
  if (isGoldSymbol(canonical) && GOLDAPI_KEY()) {
    try {
      const candles = await buildCandlesFromGoldAPI(count)
      if (candles.length > 0) {
        console.log(`[goldapi] Fetched ${candles.length} candles for ${canonical}`)
        return { candles, provider: 'goldapi' }
      }
    } catch (error) {
      console.warn('[data provider] GoldAPI candles failed:', error)
    }
  }

  if (FINNHUB_KEY()) {
    try {
      const candles = await fetchFinnhubCandles(canonical, interval, count)
      if (candles.length) return { candles, provider: 'finnhub' }
    } catch (error) {
      console.warn('[data provider] Finnhub candles failed, trying fallback:', error)
    }
  }

  if (ALPHA_KEY()) {
    try {
      const candles = await fetchAlphaCandles(canonical, interval, count)
      if (candles.length) return { candles, provider: 'alpha_vantage' }
    } catch (error) {
      console.warn('[data provider] Alpha Vantage candles failed, trying fallback:', error)
    }
  }

  if (MARKETSTACK_KEY()) {
    try {
      const candles = await fetchMarketstackCandles(canonical, interval, count)
      if (candles.length) return { candles, provider: 'marketstack' }
    } catch (error) {
      console.warn('[data provider] Marketstack candles failed, trying fallback:', error)
    }
  }

  // Fallback to synthetic: use 5180 for gold, 2650 for others
  const fallbackPrice = isGoldSymbol(canonical) ? 5180 : 2650
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
