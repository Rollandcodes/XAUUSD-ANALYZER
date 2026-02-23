// lib/analysis.ts — Enhanced ICT Technical Analysis with Multi-Timeframe Analysis
import type { Candle } from './twelvedata'

export interface AMDPhase {
  phase: 'ACCUMULATION' | 'DISTRIBUTION' | 'MANIPULATION' | 'DECLINE' | 'TRANSITION'
  description: string
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  sessionHigh: number
  sessionLow: number
  asiaHigh?: number
  asiaLow?: number
  londonHigh?: number
  londonLow?: number
  nyHigh?: number
  nyLow?: number
  manipulation: string
  strength: number // 0-100 confidence in phase detection
}

export interface OrderBlock {
  id: string
  type: 'BULLISH' | 'BEARISH'
  top: number
  bottom: number
  bodyTop: number
  bodyBottom: number
  time: number
  strength: 'STRONG' | 'MODERATE' | 'WEAK'
  touched: number // how many times price respected this block
  broken: boolean
}

export interface FVG {
  id: string
  type: 'BULLISH' | 'BEARISH'
  top: number
  bottom: number
  size: number
  midpoint: number
  time: number
  mitigated: boolean
}

export interface SRLevel {
  price: number
  type: 'SUPPORT' | 'RESISTANCE' | 'SUPPORT_MAJOR' | 'RESISTANCE_MAJOR' | 'SWING_LOW' | 'SWING_HIGH'
  touches: number
  strength: number // 0-1
  broken: boolean
  recentTest: boolean
}

export interface LiquidityZone {
  id: string
  type: 'BUY_STOPS' | 'SELL_STOPS' | 'STOP_HUNT'
  price: number
  strength: number
  swept: boolean
  time: number
}

export interface Pattern {
  type: 'CHoCH' | 'BOS' | 'LONG_WICK' | 'DOJI' | 'HAMMER' | 'SHOOTING_STAR' | 'INSIDE_BAR' | 'OUTSIDE_BAR'
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  timeframe: string
  confidence: number
  price: number
  description: string
}

export interface MTAResult {
  timeframe: string
  trend: 'UP' | 'DOWN' | 'RANGING'
  rsi: number
  signal: 'BUY' | 'SELL' | 'WAIT'
  keyLevel: number | null
  alignment: number // 0-100, how aligned with higher timeframe
}

export interface GoldSignal {
  action: 'BUY' | 'SELL' | 'WAIT'
  confidence: number
  entry: number
  entryZone: [number, number]
  stopLoss: number
  tp1: number
  tp2: number
  tp3: number
  rr1: number
  rr2: number
  rr3: number
  pips: { sl: number; tp1: number; tp2: number; tp3: number }
  confluences: string[]
  invalidation: string
  sessionBias: string
  // New enhanced fields
  mtaScore: number // Multi-timeframe alignment score
  patternScore: number // Pattern confluence score
  liquidityScore: number // Liquidity zone alignment
  overallScore: number // Weighted total
}

export type TradingSession = 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | 'OFF_HOURS'

// ==================== SESSION DETECTION ====================

export function getCurrentSession(): TradingSession {
  const hour = new Date().getUTCHours()

  // Asia session: 0:00 - 7:00 UTC
  if (hour >= 0 && hour < 7) return 'ASIA'
  // London overlap with Asia: 7:00 - 8:00 UTC
  if (hour >= 7 && hour < 8) return 'OVERLAP'
  // London session: 8:00 - 16:00 UTC
  if (hour >= 8 && hour < 16) return 'LONDON'
  // NY overlap with London: 13:00 - 16:00 UTC
  if (hour >= 13 && hour < 16) return 'OVERLAP'
  // NY session: 16:00 - 21:00 UTC
  if (hour >= 16 && hour < 21) return 'NEW_YORK'
  // Off hours: 21:00 - 0:00 UTC
  return 'OFF_HOURS'
}

export function getSessionName(session: TradingSession): string {
  const names: Record<TradingSession, string> = {
    ASIA: 'Asian Session',
    LONDON: 'London Session',
    NEW_YORK: 'New York Session',
    OVERLAP: 'London/NY Overlap',
    OFF_HOURS: 'Off Hours'
  }
  return names[session]
}

// ==================== ENHANCED AMD DETECTION ====================

export function detectAMD(candles: Candle[], interval: string): AMDPhase {
  const latest = candles[candles.length - 1]
  const last20 = candles.slice(-20)
  const last50 = candles.slice(-50)

  // Calculate session-specific highs/lows
  const { asia, london, ny } = detectSessionRanges(candles)

  const sessionHigh = Math.max(...last20.map(c => c.high))
  const sessionLow = Math.min(...last20.map(c => c.low))
  const recentHigh = Math.max(...last50.map(c => c.high))
  const recentLow = Math.min(...last50.map(c => c.low))

  // Price position analysis
  const pricePosition = (latest.close - sessionLow) / (sessionHigh - sessionLow)
  const rangeExpansion = (sessionHigh - sessionLow) / (recentHigh - recentLow)

  // Detect phase based on multiple factors
  let phase: AMDPhase['phase'] = 'TRANSITION'
  let description = ''
  let strength = 50

  // Accumulation: price near lows, consolidating, low volatility
  if (pricePosition < 0.35 && rangeExpansion < 0.5) {
    phase = 'ACCUMULATION'
    description = 'Price consolidating near session lows — potential accumulation phase'
    strength = 70
  }
  // Distribution: price near highs, distributing, high volatility
  else if (pricePosition > 0.65 && rangeExpansion < 0.5) {
    phase = 'DISTRIBUTION'
    description = 'Price distributing near session highs — potential distribution phase'
    strength = 70
  }
  // Manipulation: sharp spikes followed by reversal
  else if (detectManipulation(candles)) {
    phase = 'MANIPULATION'
    description = 'Recent liquidity sweep detected — awaiting structure confirmation'
    strength = 60
  }
  // Decline: sustained downtrend
  else if (detectDecline(candles)) {
    phase = 'DECLINE'
    description = 'Clear bearish structure — downtrend in progress'
    strength = 75
  }
  // Default to transition/ranging
  else {
    phase = 'TRANSITION'
    description = 'Market in transition — awaiting clear directional bias'
    strength = 40
  }

  // Determine bias
  let bias: AMDPhase['bias'] = 'NEUTRAL'
  if (pricePosition > 0.6) bias = 'BEARISH'
  else if (pricePosition < 0.4) bias = 'BULLISH'

  // Check EMA alignment for bias confirmation
  const ema20 = calculateEMA(candles, 20)
  const ema50 = calculateEMA(candles, 50)
  if (ema20 && ema50) {
    if (ema20 > ema50) bias = bias === 'BEARISH' ? 'NEUTRAL' : 'BULLISH'
    else bias = bias === 'BULLISH' ? 'NEUTRAL' : 'BEARISH'
  }

  return {
    phase,
    description,
    bias,
    sessionHigh,
    sessionLow,
    asiaHigh: asia?.high,
    asiaLow: asia?.low,
    londonHigh: london?.high,
    londonLow: london?.low,
    nyHigh: ny?.high,
    nyLow: ny?.low,
    manipulation: phase === 'MANIPULATION' ? 'Liquidity sweep detected - await return to fair value' : 'Monitoring for liquidity sweeps',
    strength
  }
}

function detectSessionRanges(candles: Candle[]): { asia?: { high: number; low: number }; london?: { high: number; low: number }; ny?: { high: number; low: number } } {
  // Simplified session detection based on time
  const recent = candles.slice(-50)
  const midpoint = Math.floor(recent.length / 2)

  return {
    asia: {
      high: Math.max(...recent.slice(0, midpoint).map(c => c.high)),
      low: Math.min(...recent.slice(0, midpoint).map(c => c.low))
    },
    london: {
      high: Math.max(...recent.slice(midpoint).map(c => c.high)),
      low: Math.min(...recent.slice(midpoint).map(c => c.low))
    }
  }
}

function detectManipulation(candles: Candle[]): boolean {
  // Look for wick spikes that get filled quickly
  const recent = candles.slice(-10)
  for (let i = 2; i < recent.length; i++) {
    const curr = recent[i]
    const prev = recent[i - 1]

    // Large upper wick followed by close below
    const upperWick = curr.high - Math.max(curr.open, curr.close)
    const bodySize = Math.abs(curr.close - curr.open)

    if (upperWick > bodySize * 2 && curr.close < curr.high - upperWick * 0.5) {
      return true
    }
  }
  return false
}

function detectDecline(candles: Candle[]): boolean {
  const recent = candles.slice(-20)
  const highs = recent.map(c => c.high)
  const lows = recent.map(c => c.low)

  // Check for lower highs and lower lows
  let lowerHighs = 0
  let lowerLows = 0

  for (let i = 1; i < highs.length; i++) {
    if (highs[i] < highs[i - 1]) lowerHighs++
    if (lows[i] < lows[i - 1]) lowerLows++
  }

  return lowerHighs > 12 && lowerLows > 12
}

function calculateEMA(candles: Candle[], period: number): number | null {
  if (candles.length < period) return null

  const closes = candles.map(c => c.close)
  const multiplier = 2 / (period + 1)

  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period

  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema
  }

  return ema
}

// ==================== MULTI-TIMEFRAME ANALYSIS ====================

export function analyzeMultiTimeframe(
  candlesM15: Candle[],
  candlesH1: Candle[],
  candlesH4: Candle[],
  candlesD1: Candle[],
  rsiM15: number,
  rsiH1: number,
  rsiH4: number,
  rsiD1: number
): MTAResult[] {
  const results: MTAResult[] = []

  // M15
  results.push({
    timeframe: 'M15',
    trend: detectTrend(candlesM15),
    rsi: rsiM15,
    signal: generateMTASignal(detectTrend(candlesM15), rsiM15),
    keyLevel: findKeyLevel(candlesM15),
    alignment: 0 // Will calculate below
  })

  // H1
  results.push({
    timeframe: 'H1',
    trend: detectTrend(candlesH1),
    rsi: rsiH1,
    signal: generateMTASignal(detectTrend(candlesH1), rsiH1),
    keyLevel: findKeyLevel(candlesH1),
    alignment: 0
  })

  // H4
  results.push({
    timeframe: 'H4',
    trend: detectTrend(candlesH4),
    rsi: rsiH4,
    signal: generateMTASignal(detectTrend(candlesH4), rsiH4),
    keyLevel: findKeyLevel(candlesH4),
    alignment: 0
  })

  // D1
  results.push({
    timeframe: 'D1',
    trend: detectTrend(candlesD1),
    rsi: rsiD1,
    signal: generateMTASignal(detectTrend(candlesD1), rsiD1),
    keyLevel: findKeyLevel(candlesD1),
    alignment: 0
  })

  // Calculate alignment scores
  const trends = results.map(r => r.trend)
  const signals = results.map(r => r.signal)

  // Higher timeframes should align
  let alignment = 0
  if (results[3].trend === results[2].trend) alignment += 25 // D1 aligns with H4
  if (results[2].trend === results[1].trend) alignment += 35 // H4 aligns with H1
  if (results[1].trend === results[0].trend) alignment += 40 // H1 aligns with M15

  results.forEach(r => r.alignment = alignment)

  return results
}

function detectTrend(candles: Candle[]): 'UP' | 'DOWN' | 'RANGING' {
  const recent = candles.slice(-50)
  const highs = recent.map(c => c.high)
  const lows = recent.map(c => c.low)

  const highSlope = (highs[highs.length - 1] - highs[0]) / highs.length
  const lowSlope = (lows[lows.length - 1] - lows[0]) / lows.length

  const threshold = 0.1 // Small threshold for range detection

  if (highSlope > threshold && lowSlope > threshold) return 'UP'
  if (highSlope < -threshold && lowSlope < -threshold) return 'DOWN'
  return 'RANGING'
}

function generateMTASignal(trend: string, rsi: number): 'BUY' | 'SELL' | 'WAIT' {
  if (trend === 'UP' && rsi < 60 && rsi > 30) return 'BUY'
  if (trend === 'DOWN' && rsi > 40 && rsi < 70) return 'SELL'
  return 'WAIT'
}

function findKeyLevel(candles: Candle[]): number | null {
  const recent = candles.slice(-20)
  const highs = recent.map(c => c.high)
  const lows = recent.map(c => c.low)

  return {
    high: Math.max(...highs),
    low: Math.min(...lows)
  } as any
}

// ==================== ADVANCED PATTERN RECOGNITION ====================

export function detectPatterns(candles: Candle[]): Pattern[] {
  const patterns: Pattern[] = []

  // Recent candles for pattern detection
  const recent = candles.slice(-10)

  for (let i = 2; i < recent.length; i++) {
    const curr = recent[i]
    const prev = recent[i - 1]
    const prev2 = recent[i - 2]

    // Change of Character (CHoCH)
    if (detectCHoCH(recent.slice(0, i + 1))) {
      patterns.push({
        type: 'CHoCH',
        direction: detectCHoCHDirection(recent.slice(0, i + 1)),
        timeframe: 'H1',
        confidence: 70,
        price: curr.close,
        description: 'Change of Character detected - market structure shift'
      })
    }

    // Break of Structure (BOS)
    const bos = detectBOS(recent.slice(0, i + 1))
    if (bos) {
      patterns.push({
        type: 'BOS',
        direction: bos.direction,
        timeframe: 'H1',
        confidence: 75,
        price: bos.price,
        description: `Break of Structure to the ${bos.direction.toLowerCase()}`
      })
    }

    // Long wick detection
    const upperWick = curr.high - Math.max(curr.open, curr.close)
    const lowerWick = Math.min(curr.open, curr.close) - curr.low
    const body = Math.abs(curr.close - curr.open)

    if (upperWick > body * 2) {
      patterns.push({
        type: 'LONG_WICK',
        direction: 'BEARISH',
        timeframe: 'H1',
        confidence: 60,
        price: curr.high,
        description: 'Long upper wick - potential rejection'
      })
    }

    if (lowerWick > body * 2) {
      patterns.push({
        type: 'LONG_WICK',
        direction: 'BULLISH',
        timeframe: 'H1',
        confidence: 60,
        price: curr.low,
        description: 'Long lower wick - potential support'
      })
    }

    // Doji
    if (Math.abs(curr.close - curr.open) < (curr.high - curr.low) * 0.1) {
      patterns.push({
        type: 'DOJI',
        direction: 'NEUTRAL',
        timeframe: 'H1',
        confidence: 50,
        price: curr.close,
        description: 'Doji candle - indecision'
      })
    }
  }

  return patterns.slice(-5) // Return last 5 patterns
}

function detectCHoCH(candles: Candle[]): boolean {
  if (candles.length < 10) return false

  // Look for a sequence that breaks the prior structure
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)

  // Simple CHoCH: break of recent low after uptrend, or break of recent high after downtrend
  const mid = Math.floor(candles.length / 2)
  const firstHalfHigh = Math.max(...highs.slice(0, mid))
  const firstHalfLow = Math.min(...lows.slice(0, mid))

  // Check if recent price action breaks this structure
  const recentHighs = highs.slice(mid)
  const recentLows = lows.slice(mid)

  // Bearish CHoCH: breaks below first half low
  if (Math.min(...recentLows) < firstHalfLow) return true

  // Bullish CHoCH: breaks above first half high
  if (Math.max(...recentHighs) > firstHalfHigh) return true

  return false
}

function detectCHoCHDirection(candles: Candle[]): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  const mid = Math.floor(candles.length / 2)
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)

  const firstHalfLow = Math.min(...lows.slice(0, mid))
  const firstHalfHigh = Math.max(...highs.slice(0, mid))

  if (Math.min(...lows.slice(mid)) < firstHalfLow) return 'BEARISH'
  if (Math.max(...highs.slice(mid)) > firstHalfHigh) return 'BULLISH'

  return 'NEUTRAL'
}

function detectBOS(candles: Candle[]): { direction: 'BULLISH' | 'BEARISH'; price: number } | null {
  if (candles.length < 5) return null

  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)

  // Look for break above recent high (bullish BOS) or below recent low (bearish BOS)
  const recent = candles.slice(-3)
  const prev = candles.slice(-5, -3)

  const recentHigh = Math.max(...recent.map(c => c.high))
  const prevHigh = Math.max(...prev.map(c => c.high))
  const recentLow = Math.min(...recent.map(c => c.low))
  const prevLow = Math.min(...prev.map(c => c.low))

  if (recentHigh > prevHigh) {
    return { direction: 'BULLISH', price: recentHigh }
  }

  if (recentLow < prevLow) {
    return { direction: 'BEARISH', price: recentLow }
  }

  return null
}

// ==================== LIQUIDITY ZONE DETECTION ====================

export function detectLiquidityZones(candles: Candle[]): LiquidityZone[] {
  const zones: LiquidityZone[] = []

  // Find swing highs and lows
  const swings = findSwings(candles)

  // Recent swing highs = sell stops liquidity
  // Recent swing lows = buy stops liquidity
  const recentSwings = swings.slice(-6)

  recentSwings.forEach((swing, i) => {
    if (swing.type === 'HIGH') {
      zones.push({
        id: `LL_${i}`,
        type: 'SELL_STOPS',
        price: swing.price,
        strength: 100 - (i * 10), // More recent = stronger
        swept: false,
        time: swing.time
      })
    } else {
      zones.push({
        id: `HL_${i}`,
        type: 'BUY_STOPS',
        price: swing.price,
        strength: 100 - (i * 10),
        swept: false,
        time: swing.time
      })
    }
  })

  // Check if any zones have been swept
  const latest = candles[candles.length - 1]
  zones.forEach(zone => {
    if (zone.type === 'SELL_STOPS' && latest.high > zone.price) {
      zone.swept = true
    }
    if (zone.type === 'BUY_STOPS' && latest.low < zone.price) {
      zone.swept = true
    }
  })

  return zones
}

function findSwings(candles: Candle[]): { type: 'HIGH' | 'LOW'; price: number; time: number }[] {
  const swings: { type: 'HIGH' | 'LOW'; price: number; time: number }[] = []

  for (let i = 5; i < candles.length - 5; i++) {
    const curr = candles[i]
    const prev5 = candles.slice(i - 5, i)
    const next5 = candles.slice(i + 1, i + 6)

    const prevHighs = prev5.map(c => c.high)
    const prevLows = prev5.map(c => c.low)
    const nextHighs = next5.map(c => c.high)
    const nextLows = next5.map(c => c.low)

    // Swing high
    if (curr.high > Math.max(...prevHighs) && curr.high > Math.max(...nextHighs)) {
      swings.push({ type: 'HIGH', price: curr.high, time: curr.time })
    }

    // Swing low
    if (curr.low < Math.min(...prevLows) && curr.low < Math.min(...nextLows)) {
      swings.push({ type: 'LOW', price: curr.low, time: curr.time })
    }
  }

  return swings
}

// ==================== ORDER BLOCKS ====================

export function detectOrderBlocks(candles: Candle[]): OrderBlock[] {
  const blocks: OrderBlock[] = []

  for (let i = 3; i < candles.length - 1; i++) {
    const prev2 = candles[i - 2]
    const prev1 = candles[i - 1]
    const curr = candles[i]
    const next = candles[i + 1]

    // Bullish OB: consecutive down candles followed by strong up move
    if (prev2.close < prev2.open && prev1.close < prev1.open && next.close > next.open) {
      const strength = calculateOBStrength(prev2, prev1, next)

      blocks.push({
        id: `OB_BULL_${i}`,
        type: 'BULLISH',
        top: Math.max(prev2.open, prev2.close, prev1.open, prev1.close),
        bottom: Math.min(prev2.open, prev2.close, prev1.open, prev1.close),
        bodyTop: Math.max(prev2.open, prev2.close),
        bodyBottom: Math.min(prev2.open, prev2.close),
        time: prev1.time,
        strength,
        touched: 0,
        broken: false
      })
    }

    // Bearish OB: consecutive up candles followed by strong down move
    if (prev2.close > prev2.open && prev1.close > prev1.open && next.close < next.open) {
      const strength = calculateOBStrength(prev2, prev1, next)

      blocks.push({
        id: `OB_BEAR_${i}`,
        type: 'BEARISH',
        top: Math.max(prev2.open, prev2.close, prev1.open, prev1.close),
        bottom: Math.min(prev2.open, prev2.close, prev1.open, prev1.close),
        bodyTop: Math.max(prev2.open, prev2.close),
        bodyBottom: Math.min(prev2.open, prev2.close),
        time: prev1.time,
        strength,
        touched: 0,
        broken: false
      })
    }
  }

  // Check how many times order blocks have been touched
  const latest = candles[candles.length - 1]
  blocks.forEach(block => {
    // Check if price respected this block
    if (block.type === 'BULLISH') {
      if (latest.low <= block.bottom && latest.close > block.bottom) {
        block.touched = 1
      }
    } else {
      if (latest.high >= block.top && latest.close < block.top) {
        block.touched = 1
      }
    }

    // Check if broken
    if (block.type === 'BULLISH' && latest.close < block.bottom) {
      block.broken = true
    }
    if (block.type === 'BEARISH' && latest.close > block.top) {
      block.broken = true
    }
  })

  return blocks.slice(-8).filter(b => !b.broken)
}

function calculateOBStrength(c1: Candle, c2: Candle, c3: Candle): 'STRONG' | 'MODERATE' | 'WEAK' {
  const moveSize = Math.abs(c3.close - c3.open)
  const setupSize = Math.abs(c2.close - c2.open) + Math.abs(c1.close - c1.open)

  const ratio = moveSize / setupSize

  if (ratio > 2.5) return 'STRONG'
  if (ratio > 1.5) return 'MODERATE'
  return 'WEAK'
}

// ==================== FAIR VALUE GAPS ====================

export function detectFVGs(candles: Candle[]): FVG[] {
  const fvgs: FVG[] = []

  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1]
    const curr = candles[i]
    const next = candles[i + 1]

    // Bullish FVG: gap between prev.high and next.low
    if (prev.high < next.low) {
      const size = next.low - prev.high
      fvgs.push({
        id: `FVG_BULL_${i}`,
        type: 'BULLISH',
        top: next.low,
        bottom: prev.high,
        size,
        midpoint: (next.low + prev.high) / 2,
        time: curr.time,
        mitigated: false
      })
    }

    // Bearish FVG: gap between prev.low and next.high
    if (prev.low > next.high) {
      const size = prev.low - next.high
      fvgs.push({
        id: `FVG_BEAR_${i}`,
        type: 'BEARISH',
        top: prev.low,
        bottom: next.high,
        size,
        midpoint: (prev.low + next.high) / 2,
        time: curr.time,
        mitigated: false
      })
    }
  }

  // Check mitigation
  const latest = candles[candles.length - 1]
  fvgs.forEach(fvg => {
    if (fvg.type === 'BULLISH' && latest.low < fvg.midpoint) {
      fvg.mitigated = true
    }
    if (fvg.type === 'BEARISH' && latest.high > fvg.midpoint) {
      fvg.mitigated = true
    }
  })

  return fvgs.slice(-5).filter(f => !f.mitigated)
}

// ==================== SUPPORT & RESISTANCE ====================

export function detectSRLevels(candleArray: Candle[]): SRLevel[] {
  const levels: SRLevel[] = []
  const highs = candleArray.map(c => c.high)
  const lows = candleArray.map(c => c.low)

  // Find local maxima and minima
  const swingHighs: number[] = []
  const swingLows: number[] = []

  for (let i = 5; i < candleArray.length - 5; i++) {
    const curr = candleArray[i]
    const prev5 = candleArray.slice(i - 5, i)
    const next5 = candleArray.slice(i + 1, i + 6)

    if (curr.high > Math.max(...prev5.map(c => c.high)) && curr.high > Math.max(...next5.map(c => c.high))) {
      swingHighs.push(curr.high)
    }
    if (curr.low < Math.min(...prev5.map(c => c.low)) && curr.low < Math.min(...next5.map(c => c.low))) {
      swingLows.push(curr.low)
    }
  }

  // Cluster nearby levels
  const clusterTolerance = 15 // $15

  const clusterLevels = (levels: number[], type: 'SUPPORT' | 'RESISTANCE'): SRLevel[] => {
    if (levels.length === 0) return []

    const sorted = [...levels].sort((a, b) => a - b)
    const clusters: number[][] = []
    let currentCluster = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - currentCluster[currentCluster.length - 1] < clusterTolerance) {
        currentCluster.push(sorted[i])
      } else {
        clusters.push(currentCluster)
        currentCluster = [sorted[i]]
      }
    }
    clusters.push(currentCluster)

    return clusters.map(cluster => {
      const price = cluster.reduce((a, b) => a + b, 0) / cluster.length
      const touches = cluster.length

      return {
        price,
        type,
        touches,
        strength: Math.min(touches / 5, 1),
        broken: false,
        recentTest: touches > 0
      }
    })
  }

  const supports = clusterLevels(swingLows, 'SUPPORT')
  const resistances = clusterLevels(swingHighs, 'RESISTANCE')

  // Check if broken
  const latest = candleArray[candleArray.length - 1]
  ;[...supports, ...resistances].forEach(level => {
    if (level.type === 'SUPPORT' && latest.close < level.price) {
      level.broken = true
    }
    if (level.type === 'RESISTANCE' && latest.close > level.price) {
      level.broken = true
    }

    // Check if tested recently
    const recent = candleArray.slice(-10)
    const wasTested = recent.some(c =>
      Math.abs(c.low - level.price) < 10 || Math.abs(c.high - level.price) < 10
    )
    level.recentTest = wasTested
  })

  // Combine and sort by strength
  const allLevels = [...supports, ...resistances]
    .filter(l => !l.broken)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6)

  return allLevels
}

// ==================== SIGNAL GENERATION ====================

export function buildSignal(
  candles: Candle[],
  rsi: number,
  macd: any,
  bbands: any,
  atr: number,
  amd: AMDPhase,
  orderBlocks: OrderBlock[],
  fvgs: FVG[],
  srLevels: SRLevel[]
): GoldSignal {
  const latest = candles[candles.length - 1]
  const price = latest.close

  let action: 'BUY' | 'SELL' | 'WAIT' = 'WAIT'
  let baseConfidence = 50
  const confluences: string[] = []
  let mtaScore = 0
  let patternScore = 0
  let liquidityScore = 0

  // RSI-based signals
  if (rsi < 30) {
    action = 'BUY'
    baseConfidence = 65
    confluences.push('RSI oversold (<30) — bullish reversal opportunity')
  } else if (rsi > 70) {
    action = 'SELL'
    baseConfidence = 65
    confluences.push('RSI overbought (>70) — bearish reversal risk')
  } else if (rsi < 40 && rsi >= 30) {
    if (macd.histogram > 0) {
      action = 'BUY'
      baseConfidence = 60
      confluences.push('RSI recovering from oversold + MACD bullish')
    }
  } else if (rsi > 60 && rsi <= 70) {
    if (macd.histogram < 0) {
      action = 'SELL'
      baseConfidence = 60
      confluences.push('RSI declining from overbought + MACD bearish')
    }
  }

  // AMD bias override
  if (amd.bias !== 'NEUTRAL' && action === 'WAIT') {
    if (amd.bias === 'BULLISH' && rsi < 55) {
      action = 'BUY'
      baseConfidence = 55
      confluences.push(`AMD ${amd.phase} with bullish bias`)
    } else if (amd.bias === 'BEARISH' && rsi > 45) {
      action = 'SELL'
      baseConfidence = 55
      confluences.push(`AMD ${amd.phase} with bearish bias`)
    }
  }

  // Check order blocks for entry zones
  const relevantOBs = orderBlocks.filter(ob => {
    if (action === 'BUY' && ob.type === 'BULLISH') return true
    if (action === 'SELL' && ob.type === 'BEARISH') return true
    return false
  })

  if (relevantOBs.length > 0) {
    const strongOBs = relevantOBs.filter(ob => ob.strength === 'STRONG')
    if (strongOBs.length > 0) {
      baseConfidence += 10
      patternScore += 25
      confluences.push(`${strongOBs.length} strong order block(s) aligned`)
    } else {
      baseConfidence += 5
      patternScore += 15
      confluences.push(`${relevantOBs.length} order block(s) in zone`)
    }
  }

  // Check FVGs
  const relevantFVGs = fvgs.filter(fvg => {
    if (action === 'BUY' && fvg.type === 'BULLISH') return true
    if (action === 'SELL' && fvg.type === 'BEARISH') return true
    return false
  })

  if (relevantFVGs.length > 0) {
    baseConfidence += 5
    patternScore += 10
    confluences.push(`${relevantFVGs.length} FVG(s) providing entry context`)
  }

  // Check S&R alignment
  const relevantSR = srLevels.filter(sr => {
    if (action === 'BUY' && sr.type.includes('SUPPORT')) return true
    if (action === 'SELL' && sr.type.includes('RESISTANCE')) return true
    return false
  })

  if (relevantSR.length > 0) {
    baseConfidence += (relevantSR.length * 5)
    patternScore += relevantSR.length * 10
    confluences.push(`${relevantSR.length} S/R level(s) supporting direction`)
  }

  // AMD strength adjustment
  mtaScore = amd.strength

  // Calculate confidence with weights
  let confidence = baseConfidence
  confidence += Math.min(mtaScore * 0.2, 15)
  confidence += Math.min(patternScore * 0.3, 15)
  confidence = Math.min(confidence, 95)

  // Calculate entry, SL, TP
  const entry = price
  const slDistance = atr * 1.5
  const sl = action === 'BUY' ? price - slDistance : price + slDistance
  const tp1 = action === 'BUY' ? price + slDistance * 2 : price - slDistance * 2
  const tp2 = action === 'BUY' ? price + slDistance * 3 : price - slDistance * 3
  const tp3 = action === 'BUY' ? price + slDistance * 4 : price - slDistance * 4

  // Calculate entry zone
  const entryZone: [number, number] = action === 'BUY'
    ? [price - atr * 0.5, price + atr * 0.5]
    : [price - atr * 0.5, price + atr * 0.5]

  return {
    action,
    confidence: Math.round(confidence),
    entry,
    entryZone,
    stopLoss: sl,
    tp1,
    tp2,
    tp3,
    rr1: Math.abs(tp1 - entry) / Math.abs(entry - sl),
    rr2: Math.abs(tp2 - entry) / Math.abs(entry - sl),
    rr3: Math.abs(tp3 - entry) / Math.abs(entry - sl),
    pips: {
      sl: Math.abs(entry - sl) * 10,
      tp1: Math.abs(tp1 - entry) * 10,
      tp2: Math.abs(tp2 - entry) * 10,
      tp3: Math.abs(tp3 - entry) * 10
    },
    confluences,
    invalidation: action === 'BUY' ? `Price below $${sl.toFixed(2)}` : `Price above $${sl.toFixed(2)}`,
    sessionBias: amd.bias,
    mtaScore,
    patternScore,
    liquidityScore,
    overallScore: Math.round(confidence)
  }
}
