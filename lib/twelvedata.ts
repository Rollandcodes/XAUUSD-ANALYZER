// lib/twelvedata.ts — Twelve Data API integration
const API_KEY = () => process.env.TWELVE_DATA_API_KEY!
const ALPHA_KEY = () => process.env.ALPHAVANTAGE_API_KEY
const MARKETSTACK_KEY = () => process.env.MARKETSTACK_API_KEY
const BASE = 'https://api.twelvedata.com'
const ALPHA_BASE = 'https://www.alphavantage.co/query'
const MARKETSTACK_BASE = 'https://api.marketstack.com/v1'

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

const candleCache = new Map<string, Candle[]>()

function parseSymbol(symbol: string): { from: string; to: string } {
  const [from = 'XAU', to = 'USD'] = symbol.split('/')
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

async function fetchAlpha(params: Record<string, string>) {
  const key = ALPHA_KEY()
  if (!key) {
    throw new Error('Missing ALPHAVANTAGE_API_KEY')
  }

  const url = new URL(ALPHA_BASE)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))
  url.searchParams.append('apikey', key)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  let res: Response
  try {
    res = await fetch(url.toString(), { cache: 'no-store', signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) throw new Error(`Alpha Vantage API error: ${res.status}`)
  const data = await res.json()
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

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  let res: Response
  try {
    res = await fetch(url.toString(), { cache: 'no-store', signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    throw new Error(`Marketstack API error: ${res.status}`)
  }

  const data = await res.json()
  if (data?.error) {
    const message = data?.error?.message ?? data?.error?.code ?? 'Unknown error'
    throw new Error(`Marketstack API error: ${message}`)
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

async function fetchAlphaCandles(symbol: string, interval: string, count: number): Promise<Candle[]> {
  const cacheKey = `${symbol}:${interval}:${count}`
  const cached = candleCache.get(cacheKey)
  if (cached) return cached

  const { from, to } = parseSymbol(symbol)
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
  candleCache.set(cacheKey, finalCandles)
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

function quoteFromCandles(symbol: string, candles: Candle[]): Quote {
  const last = candles[candles.length - 1]
  const prev = candles[candles.length - 2] ?? last
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  const change = (last?.close ?? 2650) - (prev?.close ?? 2650)
  const percentChange = prev?.close ? (change / prev.close) * 100 : 0

  return {
    symbol,
    close: last?.close ?? 2650,
    change,
    percent_change: percentChange,
    high: last?.high ?? 2660,
    low: last?.low ?? 2640,
    open: last?.open ?? 2650,
    volume: last?.volume ?? 0,
    fifty_two_week: {
      low: lows.length ? Math.min(...lows) : 2000,
      high: highs.length ? Math.max(...highs) : 2700
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
    const last = closes[closes.length - 1] ?? 2650
    return { upper: last + 30, middle: last, lower: last - 30 }
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

async function fetchTwelve(endpoint: string, params: Record<string, any>) {
  const key = API_KEY()
  if (!key) {
    throw new Error('Missing TWELVE_DATA_API_KEY')
  }

  const url = new URL(`${BASE}/${endpoint}`)
  url.searchParams.append('apikey', key)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)))

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  let res: Response
  try {
    res = await fetch(url.toString(), { cache: 'no-store', signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) throw new Error(`Twelve Data API error: ${res.status}`)
  const data = await res.json()
  if (data?.status === 'error') {
    throw new Error(`Twelve Data API error: ${data?.message ?? 'Unknown error'}`)
  }
  return data
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  if (process.env.TWELVE_DATA_API_KEY) {
    try {
      const data = await fetchTwelve('quote', { symbol })
      return {
        symbol: data.symbol ?? symbol,
        close: parseFloat(data.close ?? 2650),
        change: parseFloat(data.change ?? 0),
        percent_change: parseFloat(data.percent_change ?? 0),
        high: parseFloat(data.high ?? 2660),
        low: parseFloat(data.low ?? 2640),
        open: parseFloat(data.open ?? 2650),
        volume: parseInt(data.volume ?? 0),
        fifty_two_week: {
          low: parseFloat(data.fifty_two_week?.low ?? 2000),
          high: parseFloat(data.fifty_two_week?.high ?? 2700)
        }
      }
    } catch (error) {
      console.warn('[data provider] Twelve Data quote failed, trying fallback:', error)
    }
  }

  if (ALPHA_KEY()) {
    try {
      const candles = await fetchAlphaCandles(symbol, '1day', 260)
      if (candles.length) return quoteFromCandles(symbol, candles)
    } catch (error) {
      console.warn('[data provider] Alpha Vantage quote failed, trying fallback:', error)
    }
  }

  if (MARKETSTACK_KEY()) {
    try {
      const candles = await fetchMarketstackCandles(symbol, '1day', 260)
      if (candles.length) return quoteFromCandles(symbol, candles)
    } catch (error) {
      console.warn('[data provider] Marketstack quote failed, using synthetic fallback:', error)
    }
  }

  return quoteFromCandles(symbol, generateMockCandles(260, 2650))
}

export async function fetchCandles(symbol: string, interval: string, count: number): Promise<Candle[]> {
  if (process.env.TWELVE_DATA_API_KEY) {
    try {
      const data = await fetchTwelve('time_series', { symbol, interval, outputsize: count })
      if (data.values && Array.isArray(data.values)) {
        return data.values.map((v: any) => ({
          time: new Date(v.datetime).getTime() / 1000,
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          volume: parseFloat(v.volume ?? 0)
        })).reverse()
      }
    } catch (error) {
      console.warn('[data provider] Twelve Data candles failed, trying fallback:', error)
    }
  }

  if (ALPHA_KEY()) {
    try {
      const candles = await fetchAlphaCandles(symbol, interval, count)
      if (candles.length) return candles
    } catch (error) {
      console.warn('[data provider] Alpha Vantage candles failed, trying fallback:', error)
    }
  }

  if (MARKETSTACK_KEY()) {
    try {
      const candles = await fetchMarketstackCandles(symbol, interval, count)
      if (candles.length) return candles
    } catch (error) {
      console.warn('[data provider] Marketstack candles failed, using synthetic fallback:', error)
    }
  }

  return generateMockCandles(count, 2650)
}

export async function fetchRSI(symbol: string, interval: string): Promise<number> {
  if (process.env.TWELVE_DATA_API_KEY) {
    try {
      const data = await fetchTwelve('rsi', { symbol, interval })
      return parseFloat(data.values?.[0]?.rsi ?? 50)
    } catch {
      // fall through
    }
  }

  try {
    const candles = await fetchCandles(symbol, interval, 160)
    return calculateRSI(candles)
  } catch {
    return 50
  }
}

export async function fetchMACD(symbol: string, interval: string): Promise<{ macd: number; signal: number; histogram: number }> {
  if (process.env.TWELVE_DATA_API_KEY) {
    try {
      const data = await fetchTwelve('macd', { symbol, interval })
      const val = data.values?.[0]
      return {
        macd: parseFloat(val?.macd ?? 0),
        signal: parseFloat(val?.macd_signal ?? 0),
        histogram: parseFloat(val?.macd_hist ?? 0)
      }
    } catch {
      // fall through
    }
  }

  try {
    const candles = await fetchCandles(symbol, interval, 200)
    return calculateMACD(candles)
  } catch {
    return { macd: 0, signal: 0, histogram: 0 }
  }
}

export async function fetchBBands(symbol: string, interval: string): Promise<{ upper: number; middle: number; lower: number }> {
  if (process.env.TWELVE_DATA_API_KEY) {
    try {
      const data = await fetchTwelve('bbands', { symbol, interval })
      const val = data.values?.[0]
      return {
        upper: parseFloat(val?.upper_band ?? 2680),
        middle: parseFloat(val?.middle_band ?? 2650),
        lower: parseFloat(val?.lower_band ?? 2620)
      }
    } catch {
      // fall through
    }
  }

  try {
    const candles = await fetchCandles(symbol, interval, 200)
    return calculateBBands(candles)
  } catch {
    return { upper: 2680, middle: 2650, lower: 2620 }
  }
}

export async function fetchATR(symbol: string, interval: string): Promise<number> {
  if (process.env.TWELVE_DATA_API_KEY) {
    try {
      const data = await fetchTwelve('atr', { symbol, interval })
      return parseFloat(data.values?.[0]?.atr ?? 15)
    } catch {
      // fall through
    }
  }

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
