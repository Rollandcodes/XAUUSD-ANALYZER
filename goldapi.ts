// lib/goldapi.ts — GoldAPI.io integration
// Endpoint: https://www.goldapi.io/api/XAU/USD
// Auth:     x-access-token: YOUR_API_KEY
// Free tier: 100 req/month, daily historical, 2s update interval

export interface GoldSpot {
  timestamp:      number
  metal:          string       // "XAU"
  currency:       string       // "USD"
  ask:            number       // live ask price
  bid:            number       // live bid price
  price:          number       // mid price
  ch:             number       // change from previous close
  chp:            number       // change % from previous close
  prev_close_price: number
  // Gram prices (useful for retail context)
  price_gram_24k: number
  price_gram_22k: number
  price_gram_21k: number
  price_gram_18k: number
  // Computed
  spread:         number       // ask - bid
  spreadPct:      number       // spread as % of mid
}

export interface GoldHistorical {
  date:           string
  price:          number
  ask:            number
  bid:            number
  ch:             number
  chp:            number
}

const BASE = 'https://www.goldapi.io/api'
const KEY  = () => process.env.GOLDAPI_KEY!

function headers() {
  return {
    'x-access-token': KEY(),
    'Content-Type':   'application/json',
  }
}

// ── Live spot price ───────────────────────────────────────────────────────────
export async function fetchGoldSpot(): Promise<GoldSpot | null> {
  try {
    const res  = await fetch(`${BASE}/XAU/USD`, { headers: headers(), cache: 'no-store' })
    if (!res.ok) {
      console.warn('[goldapi] spot returned', res.status)
      return null
    }
    const d = await res.json()
    if (d.error) { console.warn('[goldapi] error:', d.error); return null }

    const mid    = d.price ?? ((d.ask + d.bid) / 2)
    const spread = (d.ask ?? mid) - (d.bid ?? mid)

    return {
      timestamp:        d.timestamp,
      metal:            d.metal,
      currency:         d.currency,
      ask:              d.ask       ?? mid,
      bid:              d.bid       ?? mid,
      price:            mid,
      ch:               d.ch        ?? 0,
      chp:              d.chp       ?? 0,
      prev_close_price: d.prev_close_price ?? (mid - (d.ch ?? 0)),
      price_gram_24k:   d.price_gram_24k   ?? mid / 31.1035,
      price_gram_22k:   d.price_gram_22k   ?? (mid / 31.1035) * (22/24),
      price_gram_21k:   d.price_gram_21k   ?? (mid / 31.1035) * (21/24),
      price_gram_18k:   d.price_gram_18k   ?? (mid / 31.1035) * (18/24),
      spread:           parseFloat(spread.toFixed(2)),
      spreadPct:        parseFloat(((spread / mid) * 100).toFixed(4)),
    }
  } catch (err) {
    console.warn('[goldapi] fetch failed:', err)
    return null
  }
}

// ── Historical spot price for a specific date ─────────────────────────────────
export async function fetchGoldHistorical(dateYYYYMMDD: string): Promise<GoldHistorical | null> {
  try {
    const res = await fetch(`${BASE}/XAU/USD/${dateYYYYMMDD}`, { headers: headers() })
    if (!res.ok) return null
    const d = await res.json()
    if (d.error) return null
    return {
      date:  dateYYYYMMDD,
      price: d.price,
      ask:   d.ask,
      bid:   d.bid,
      ch:    d.ch,
      chp:   d.chp,
    }
  } catch {
    return null
  }
}

// ── Last 7 days historical prices ─────────────────────────────────────────────
// Used to compute weekly range and trend context
export async function fetchGoldWeekHistory(): Promise<GoldHistorical[]> {
  const results: GoldHistorical[] = []
  const today = new Date()

  for (let i = 1; i <= 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '')
    const hist = await fetchGoldHistorical(dateStr)
    if (hist) results.push(hist)
  }

  return results.reverse()  // oldest → newest
}

// ── Spot-derived insights ─────────────────────────────────────────────────────
export interface SpotInsights {
  // Spread quality
  spreadQuality:  'TIGHT' | 'NORMAL' | 'WIDE'
  spreadNote:     string
  // Bid/Ask context for entry
  entryNote:      string     // e.g. "Enter at bid for BUY — price $X"
  // Weekly context (if history available)
  weeklyRange?:   { high: number; low: number; midpoint: number; positionPct: number }
  weeklyTrend?:   'UPTREND' | 'DOWNTREND' | 'SIDEWAYS'
  // Gram price context
  gramPrices: {
    oz_24k: number; oz_22k: number; oz_21k: number; oz_18k: number
    g_24k:  number; g_22k:  number; g_21k:  number; g_18k:  number
  }
}

export function computeSpotInsights(spot: GoldSpot, history?: GoldHistorical[]): SpotInsights {
  // Spread quality for XAUUSD (typical spread: $0.10–$0.50)
  let spreadQuality: SpotInsights['spreadQuality']
  let spreadNote: string
  if (spot.spreadPct < 0.02) {
    spreadQuality = 'TIGHT'
    spreadNote = `Spread ${spot.spread.toFixed(2)} (${spot.spreadPct}%) — excellent liquidity, ideal entry conditions`
  } else if (spot.spreadPct < 0.05) {
    spreadQuality = 'NORMAL'
    spreadNote = `Spread ${spot.spread.toFixed(2)} (${spot.spreadPct}%) — normal conditions`
  } else {
    spreadQuality = 'WIDE'
    spreadNote = `Spread ${spot.spread.toFixed(2)} (${spot.spreadPct}%) — wide spread, possible low liquidity or news event`
  }

  const entryNote = `BUY at ask ${spot.ask.toFixed(2)} · SELL at bid ${spot.bid.toFixed(2)} · Mid ${spot.price.toFixed(2)}`

  // Weekly range
  let weeklyRange: SpotInsights['weeklyRange'] | undefined
  let weeklyTrend: SpotInsights['weeklyTrend'] | undefined

  if (history && history.length >= 3) {
    const weekHigh = Math.max(...history.map(h => h.price), spot.price)
    const weekLow  = Math.min(...history.map(h => h.price), spot.price)
    const midpoint = (weekHigh + weekLow) / 2
    const positionPct = parseFloat(((spot.price - weekLow) / (weekHigh - weekLow) * 100).toFixed(1))

    weeklyRange = { high: weekHigh, low: weekLow, midpoint, positionPct }

    const first = history[0].price
    const last  = history[history.length - 1].price
    const diff  = last - first
    weeklyTrend = Math.abs(diff) < (weekHigh - weekLow) * 0.2
      ? 'SIDEWAYS'
      : diff > 0 ? 'UPTREND' : 'DOWNTREND'
  }

  const ozPrice = spot.price
  const gramFactor = 31.1035

  return {
    spreadQuality, spreadNote, entryNote, weeklyRange, weeklyTrend,
    gramPrices: {
      oz_24k: ozPrice,
      oz_22k: spot.price_gram_22k * gramFactor,
      oz_21k: spot.price_gram_21k * gramFactor,
      oz_18k: spot.price_gram_18k * gramFactor,
      g_24k:  spot.price_gram_24k,
      g_22k:  spot.price_gram_22k,
      g_21k:  spot.price_gram_21k,
      g_18k:  spot.price_gram_18k,
    },
  }
}
