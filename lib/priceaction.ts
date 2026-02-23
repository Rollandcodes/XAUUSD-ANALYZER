// lib/priceaction.ts - Price Action Analysis for XAUUSD
export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface CandlestickPattern {
  name: string
  type: 'bullish' | 'bearish' | 'neutral'
  strength: 'strong' | 'moderate' | 'weak'
  index: number
  confidence: number
  description: string
}

export interface WickAnalysis {
  upperWickRatio: number
  lowerWickRatio: number
  bodyRatio: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  rejectionType: 'upper' | 'lower' | 'none'
  significance: number
}

export interface ChartPattern {
  name: string
  type: 'continuation' | 'reversal'
  direction: 'bullish' | 'bearish'
  startIndex: number
  endIndex: number
  breakoutLevel: number
  targetLevel: number
  confidence: number
}

export interface PriceActionSignal {
  action: 'BUY' | 'SELL' | 'WAIT'
  confidence: number
  entry: number
  stopLoss: number
  takeProfit1: number
  takeProfit2: number
  riskReward: number
  patterns: CandlestickPattern[]
  chartPattern: ChartPattern | null
  wickAnalysis: WickAnalysis
  confluences: string[]
}

// Candlestick Pattern Detection
export function detectCandlestickPatterns(candles: Candle[]): CandlestickPattern[] {
  const patterns: CandlestickPattern[] = []
  if (candles.length < 3) return patterns

  for (let i = 2; i < candles.length; i++) {
    const current = candles[i]
    const prev = candles[i - 1]
    const prev2 = candles[i - 2]

    // Bullish Engulfing
    const bullishEngulfing = detectBullishEngulfing(prev, current)
    if (bullishEngulfing) patterns.push({ ...bullishEngulfing, index: i })

    // Bearish Engulfing
    const bearishEngulfing = detectBearishEngulfing(prev, current)
    if (bearishEngulfing) patterns.push({ ...bearishEngulfing, index: i })

    // Hammer
    const hammer = detectHammer(current)
    if (hammer) patterns.push({ ...hammer, index: i })

    // Shooting Star
    const shootingStar = detectShootingStar(current)
    if (shootingStar) patterns.push({ ...shootingStar, index: i })

    // Doji
    const doji = detectDoji(current)
    if (doji) patterns.push({ ...doji, index: i })

    // Morning Star (3-candle pattern)
    const morningStar = detectMorningStar(prev2, prev, current)
    if (morningStar) patterns.push({ ...morningStar, index: i })

    // Evening Star (3-candle pattern)
    const eveningStar = detectEveningStar(prev2, prev, current)
    if (eveningStar) patterns.push({ ...eveningStar, index: i })

    // Pin Bar
    const pinBar = detectPinBar(current)
    if (pinBar) patterns.push({ ...pinBar, index: i })
  }

  return patterns
}

function detectBullishEngulfing(prev: Candle, current: Candle): CandlestickPattern | null {
  const prevBody = Math.abs(prev.close - prev.open)
  const currentBody = Math.abs(current.close - current.open)
  
  if (prev.close < prev.open && current.close > current.open) {
    if (current.open <= prev.close && current.close >= prev.open) {
      const engulfmentRatio = currentBody / prevBody
      const strength = engulfmentRatio > 2 ? 'strong' : engulfmentRatio > 1.5 ? 'moderate' : 'weak'
      const confidence = Math.min(95, 60 + engulfmentRatio * 15)
      
      return {
        name: 'Bullish Engulfing',
        type: 'bullish',
        strength,
        index: 0,
        confidence,
        description: `Strong bullish reversal - ${strength} engulfment`
      }
    }
  }
  return null
}

function detectBearishEngulfing(prev: Candle, current: Candle): CandlestickPattern | null {
  const prevBody = Math.abs(prev.close - prev.open)
  const currentBody = Math.abs(current.close - current.open)
  
  if (prev.close > prev.open && current.close < current.open) {
    if (current.open >= prev.close && current.close <= prev.open) {
      const engulfmentRatio = currentBody / prevBody
      const strength = engulfmentRatio > 2 ? 'strong' : engulfmentRatio > 1.5 ? 'moderate' : 'weak'
      const confidence = Math.min(95, 60 + engulfmentRatio * 15)
      
      return {
        name: 'Bearish Engulfing',
        type: 'bearish',
        strength,
        index: 0,
        confidence,
        description: `Strong bearish reversal - ${strength} engulfment`
      }
    }
  }
  return null
}

function detectHammer(candle: Candle): CandlestickPattern | null {
  const body = Math.abs(candle.close - candle.open)
  const lowerWick = Math.min(candle.open, candle.close) - candle.low
  const upperWick = candle.high - Math.max(candle.open, candle.close)
  const range = candle.high - candle.low

  if (lowerWick > body * 2 && upperWick < body * 0.5 && body > range * 0.2) {
    const strength = lowerWick > body * 3 ? 'strong' : 'moderate'
    const confidence = Math.min(85, 65 + (lowerWick / body) * 5)
    
    return {
      name: 'Hammer',
      type: 'bullish',
      strength,
      index: 0,
      confidence,
      description: 'Bullish reversal - strong lower wick rejection'
    }
  }
  return null
}

function detectShootingStar(candle: Candle): CandlestickPattern | null {
  const body = Math.abs(candle.close - candle.open)
  const upperWick = candle.high - Math.max(candle.open, candle.close)
  const lowerWick = Math.min(candle.open, candle.close) - candle.low
  const range = candle.high - candle.low

  if (upperWick > body * 2 && lowerWick < body * 0.5 && body > range * 0.2) {
    const strength = upperWick > body * 3 ? 'strong' : 'moderate'
    const confidence = Math.min(85, 65 + (upperWick / body) * 5)
    
    return {
      name: 'Shooting Star',
      type: 'bearish',
      strength,
      index: 0,
      confidence,
      description: 'Bearish reversal - strong upper wick rejection'
    }
  }
  return null
}

function detectDoji(candle: Candle): CandlestickPattern | null {
  const body = Math.abs(candle.close - candle.open)
  const range = candle.high - candle.low

  if (body < range * 0.1 && range > 0) {
    return {
      name: 'Doji',
      type: 'neutral',
      strength: 'moderate',
      index: 0,
      confidence: 70,
      description: 'Market indecision - potential reversal zone'
    }
  }
  return null
}

function detectMorningStar(first: Candle, second: Candle, third: Candle): CandlestickPattern | null {
  const firstBearish = first.close < first.open
  const secondSmall = Math.abs(second.close - second.open) < Math.abs(first.close - first.open) * 0.5
  const thirdBullish = third.close > third.open && third.close > (first.open + first.close) / 2

  if (firstBearish && secondSmall && thirdBullish) {
    const strength = third.close > first.open ? 'strong' : 'moderate'
    return {
      name: 'Morning Star',
      type: 'bullish',
      strength,
      index: 0,
      confidence: 85,
      description: 'Strong bullish reversal pattern - 3 candle formation'
    }
  }
  return null
}

function detectEveningStar(first: Candle, second: Candle, third: Candle): CandlestickPattern | null {
  const firstBullish = first.close > first.open
  const secondSmall = Math.abs(second.close - second.open) < Math.abs(first.close - first.open) * 0.5
  const thirdBearish = third.close < third.open && third.close < (first.open + first.close) / 2

  if (firstBullish && secondSmall && thirdBearish) {
    const strength = third.close < first.open ? 'strong' : 'moderate'
    return {
      name: 'Evening Star',
      type: 'bearish',
      strength,
      index: 0,
      confidence: 85,
      description: 'Strong bearish reversal pattern - 3 candle formation'
    }
  }
  return null
}

function detectPinBar(candle: Candle): CandlestickPattern | null {
  const body = Math.abs(candle.close - candle.open)
  const upperWick = candle.high - Math.max(candle.open, candle.close)
  const lowerWick = Math.min(candle.open, candle.close) - candle.low
  const totalRange = candle.high - candle.low

  // Bullish Pin Bar (long lower wick)
  if (lowerWick > totalRange * 0.6 && body < totalRange * 0.3) {
    return {
      name: 'Pin Bar (Bullish)',
      type: 'bullish',
      strength: 'strong',
      index: 0,
      confidence: 80,
      description: 'Bullish pin bar - strong rejection from lows'
    }
  }

  // Bearish Pin Bar (long upper wick)
  if (upperWick > totalRange * 0.6 && body < totalRange * 0.3) {
    return {
      name: 'Pin Bar (Bearish)',
      type: 'bearish',
      strength: 'strong',
      index: 0,
      confidence: 80,
      description: 'Bearish pin bar - strong rejection from highs'
    }
  }

  return null
}

// Wick and Shadow Analysis
export function analyzeWicks(candle: Candle): WickAnalysis {
  const body = Math.abs(candle.close - candle.open)
  const upperWick = candle.high - Math.max(candle.open, candle.close)
  const lowerWick = Math.min(candle.open, candle.close) - candle.low
  const totalRange = candle.high - candle.low

  const upperWickRatio = totalRange > 0 ? upperWick / totalRange : 0
  const lowerWickRatio = totalRange > 0 ? lowerWick / totalRange : 0
  const bodyRatio = totalRange > 0 ? body / totalRange : 0

  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
  let rejectionType: 'upper' | 'lower' | 'none' = 'none'
  let significance = 0

  // Strong lower wick = bullish rejection
  if (lowerWickRatio > 0.5 && upperWickRatio < 0.2) {
    sentiment = 'bullish'
    rejectionType = 'lower'
    significance = Math.min(100, lowerWickRatio * 150)
  }
  // Strong upper wick = bearish rejection
  else if (upperWickRatio > 0.5 && lowerWickRatio < 0.2) {
    sentiment = 'bearish'
    rejectionType = 'upper'
    significance = Math.min(100, upperWickRatio * 150)
  }
  // Bullish body
  else if (candle.close > candle.open && bodyRatio > 0.6) {
    sentiment = 'bullish'
    significance = bodyRatio * 70
  }
  // Bearish body
  else if (candle.close < candle.open && bodyRatio > 0.6) {
    sentiment = 'bearish'
    significance = bodyRatio * 70
  }

  return {
    upperWickRatio,
    lowerWickRatio,
    bodyRatio,
    sentiment,
    rejectionType,
    significance
  }
}

// Chart Pattern Detection
export function detectChartPatterns(candles: Candle[]): ChartPattern[] {
  const patterns: ChartPattern[] = []
  if (candles.length < 20) return patterns

  // Detect Triangle Pattern
  const triangle = detectTriangle(candles)
  if (triangle) patterns.push(triangle)

  // Detect Wedge Pattern
  const wedge = detectWedge(candles)
  if (wedge) patterns.push(wedge)

  // Detect Flag/Pennant
  const flag = detectFlag(candles)
  if (flag) patterns.push(flag)

  return patterns
}

function detectTriangle(candles: Candle[]): ChartPattern | null {
  const len = candles.length
  if (len < 20) return null

  const recentCandles = candles.slice(-20)
  const highs = recentCandles.map(c => c.high)
  const lows = recentCandles.map(c => c.low)

  const highestHigh = Math.max(...highs)
  const lowestLow = Math.min(...lows)
  const range = highestHigh - lowestLow

  // Check if range is contracting (triangle formation)
  const firstHalfRange = Math.max(...highs.slice(0, 10)) - Math.min(...lows.slice(0, 10))
  const secondHalfRange = Math.max(...highs.slice(10)) - Math.min(...lows.slice(10))

  if (secondHalfRange < firstHalfRange * 0.7) {
    const currentPrice = recentCandles[recentCandles.length - 1].close
    const direction = currentPrice > (highestHigh + lowestLow) / 2 ? 'bullish' : 'bearish'

    return {
      name: 'Symmetrical Triangle',
      type: 'continuation',
      direction,
      startIndex: len - 20,
      endIndex: len - 1,
      breakoutLevel: direction === 'bullish' ? highestHigh : lowestLow,
      targetLevel: direction === 'bullish' ? highestHigh + range : lowestLow - range,
      confidence: 75
    }
  }

  return null
}

function detectWedge(candles: Candle[]): ChartPattern | null {
  const len = candles.length
  if (len < 20) return null

  const recentCandles = candles.slice(-20)
  const closes = recentCandles.map(c => c.close)

  // Rising wedge (bearish) or falling wedge (bullish)
  const firstClose = closes[0]
  const lastClose = closes[closes.length - 1]
  const trend = lastClose > firstClose ? 'rising' : 'falling'

  const highs = recentCandles.map(c => c.high)
  const lows = recentCandles.map(c => c.low)
  const range = Math.max(...highs) - Math.min(...lows)

  // Check for converging trendlines
  const firstHalfRange = Math.max(...highs.slice(0, 10)) - Math.min(...lows.slice(0, 10))
  const secondHalfRange = Math.max(...highs.slice(10)) - Math.min(...lows.slice(10))

  if (secondHalfRange < firstHalfRange * 0.6) {
    return {
      name: trend === 'rising' ? 'Rising Wedge' : 'Falling Wedge',
      type: 'reversal',
      direction: trend === 'rising' ? 'bearish' : 'bullish',
      startIndex: len - 20,
      endIndex: len - 1,
      breakoutLevel: trend === 'rising' ? Math.min(...lows) : Math.max(...highs),
      targetLevel: trend === 'rising' ? Math.min(...lows) - range : Math.max(...highs) + range,
      confidence: 72
    }
  }

  return null
}

function detectFlag(candles: Candle[]): ChartPattern | null {
  const len = candles.length
  if (len < 15) return null

  const recentCandles = candles.slice(-15)
  const closes = recentCandles.map(c => c.close)

  // Look for consolidation after strong move
  const poleCandles = candles.slice(-25, -15)
  if (poleCandles.length < 10) return null

  const poleStart = poleCandles[0].close
  const poleEnd = poleCandles[poleCandles.length - 1].close
  const poleMove = Math.abs(poleEnd - poleStart)
  const avgBody = poleCandles.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / poleCandles.length

  // Strong pole movement required
  if (poleMove < avgBody * 5) return null

  // Flag consolidation
  const flagRange = Math.max(...closes) - Math.min(...closes)
  const direction = poleEnd > poleStart ? 'bullish' : 'bearish'

  if (flagRange < poleMove * 0.4) {
    return {
      name: direction === 'bullish' ? 'Bull Flag' : 'Bear Flag',
      type: 'continuation',
      direction,
      startIndex: len - 15,
      endIndex: len - 1,
      breakoutLevel: direction === 'bullish' ? Math.max(...closes) : Math.min(...closes),
      targetLevel: direction === 'bullish' ? poleEnd + poleMove : poleEnd - poleMove,
      confidence: 78
    }
  }

  return null
}

// Generate Price Action Signal
export function generatePriceActionSignal(
  candles: Candle[],
  currentPrice: number,
  atr: number
): PriceActionSignal {
  const patterns = detectCandlestickPatterns(candles)
  const recentPatterns = patterns.filter(p => p.index >= candles.length - 3)
  const chartPatterns = detectChartPatterns(candles)
  const lastCandle = candles[candles.length - 1]
  const wickAnalysis = analyzeWicks(lastCandle)

  const confluences: string[] = []
  let bullishScore = 0
  let bearishScore = 0

  // Score candlestick patterns
  recentPatterns.forEach(pattern => {
    if (pattern.type === 'bullish') {
      bullishScore += pattern.confidence * (pattern.strength === 'strong' ? 1.5 : 1)
      confluences.push(`${pattern.name} (${pattern.confidence.toFixed(0)}%)`)
    } else if (pattern.type === 'bearish') {
      bearishScore += pattern.confidence * (pattern.strength === 'strong' ? 1.5 : 1)
      confluences.push(`${pattern.name} (${pattern.confidence.toFixed(0)}%)`)
    }
  })

  // Score wick analysis
  if (wickAnalysis.significance > 60) {
    if (wickAnalysis.sentiment === 'bullish') {
      bullishScore += wickAnalysis.significance
      confluences.push(`Bullish wick rejection (${wickAnalysis.significance.toFixed(0)}%)`)
    } else if (wickAnalysis.sentiment === 'bearish') {
      bearishScore += wickAnalysis.significance
      confluences.push(`Bearish wick rejection (${wickAnalysis.significance.toFixed(0)}%)`)
    }
  }

  // Score chart patterns
  if (chartPatterns.length > 0) {
    const mainPattern = chartPatterns[0]
    if (mainPattern.direction === 'bullish') {
      bullishScore += mainPattern.confidence
      confluences.push(`${mainPattern.name} breakout`)
    } else {
      bearishScore += mainPattern.confidence
      confluences.push(`${mainPattern.name} breakdown`)
    }
  }

  // Determine signal
  let action: 'BUY' | 'SELL' | 'WAIT' = 'WAIT'
  let confidence = 0
  let entry = currentPrice
  let stopLoss = currentPrice
  let takeProfit1 = currentPrice
  let takeProfit2 = currentPrice

  const scoreDiff = Math.abs(bullishScore - bearishScore)
  const minConfidence = 65

  if (bullishScore > bearishScore && bullishScore > minConfidence) {
    action = 'BUY'
    confidence = Math.min(95, bullishScore)
    entry = currentPrice
    stopLoss = currentPrice - (atr * 1.5)
    takeProfit1 = currentPrice + (atr * 2)
    takeProfit2 = currentPrice + (atr * 3.5)
  } else if (bearishScore > bullishScore && bearishScore > minConfidence) {
    action = 'SELL'
    confidence = Math.min(95, bearishScore)
    entry = currentPrice
    stopLoss = currentPrice + (atr * 1.5)
    takeProfit1 = currentPrice - (atr * 2)
    takeProfit2 = currentPrice - (atr * 3.5)
  }

  const riskReward = Math.abs(takeProfit1 - entry) / Math.abs(stopLoss - entry)

  return {
    action,
    confidence,
    entry,
    stopLoss,
    takeProfit1,
    takeProfit2,
    riskReward,
    patterns: recentPatterns,
    chartPattern: chartPatterns[0] || null,
    wickAnalysis,
    confluences
  }
}
