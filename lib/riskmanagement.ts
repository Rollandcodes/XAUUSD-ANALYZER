// lib/riskmanagement.ts - Advanced Risk Management & Position Sizing

export interface RiskParameters {
  accountBalance: number
  riskPercentage: number  // e.g., 1% = 0.01
  maxPositionSize: number  // Max lot size
  minRiskReward: number    // Minimum R:R ratio (e.g., 2.0)
}

export interface PositionSizing {
  lotSize: number
  dollarRisk: number
  positionValue: number
  leverage: number
  maxDrawdown: number
  kellyPercentage: number
}

export interface SignalQualityMetrics {
  overallScore: number
  confluenceScore: number
  trendAlignment: number
  volatilityScore: number
  newsRiskScore: number
  technicalStrength: number
  tier: 'PREMIUM' | 'STANDARD' | 'FILTERED'
  recommendation: 'TAKE' | 'REDUCE' | 'SKIP'
}

/**
 * Kelly Criterion Position Sizing
 * Formula: f* = (bp - q) / b
 * where: b = odds, p = win probability, q = lose probability
 */
export function calculateKellyPositionSize(
  winRate: number,          // e.g., 0.65 for 65%
  avgWin: number,           // Average win in pips/dollars
  avgLoss: number,          // Average loss in pips/dollars
  accountBalance: number,
  conservativeFactor: number = 0.25  // Use 25% of Kelly (safer)
): number {
  if (avgLoss === 0) return 0
  
  const b = avgWin / avgLoss  // Odds
  const p = winRate
  const q = 1 - winRate
  
  const kellyPercentage = (b * p - q) / b
  const conservativeKelly = Math.max(0, kellyPercentage * conservativeFactor)
  
  // Cap at 5% max
  return Math.min(conservativeKelly, 0.05) * accountBalance
}

/**
 * Fixed Fractional Position Sizing
 * Risk fixed % of account per trade
 */
export function calculateFixedFractionalSize(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLoss: number,
  contractSize: number = 100  // Standard lot for XAUUSD
): PositionSizing {
  const dollarRisk = accountBalance * riskPercentage
  const pipRisk = Math.abs(entryPrice - stopLoss)
  
  if (pipRisk === 0) {
    return {
      lotSize: 0,
      dollarRisk: 0,
      positionValue: 0,
      leverage: 1,
      maxDrawdown: 0,
      kellyPercentage: 0
    }
  }
  
  const lotSize = dollarRisk / (pipRisk * contractSize)
  const positionValue = lotSize * entryPrice * contractSize
  const leverage = positionValue / accountBalance
  
  return {
    lotSize: Math.round(lotSize * 100) / 100,  // Round to 2 decimals
    dollarRisk,
    positionValue,
    leverage,
    maxDrawdown: dollarRisk * 3,  // Estimate max drawdown (3x risk)
    kellyPercentage: riskPercentage
  }
}

/**
 * Volatility-Adjusted Position Sizing
 * Reduce position size during high volatility
 */
export function calculateVolatilityAdjustedSize(
  baseSize: number,
  currentATR: number,
  avgATR: number,
  maxVolatilityMultiplier: number = 2
): number {
  const volatilityRatio = currentATR / avgATR
  
  if (volatilityRatio > maxVolatilityMultiplier) {
    // High volatility - reduce position
    return baseSize * (maxVolatilityMultiplier / volatilityRatio)
  }
  
  if (volatilityRatio < 0.5) {
    // Low volatility - can increase slightly
    return baseSize * 1.2
  }
  
  return baseSize
}

/**
 * Signal Quality Assessment
 * Filters low-quality signals and categorizes by tier
 */
export function assessSignalQuality(params: {
  confidence: number
  confluenceCount: number
  trendAlignment: boolean
  atr: number
  avgATR: number
  newsRisk: string
  riskReward: number
  timeframe: string
  sessionActive: boolean
  priceActionConfirmation: boolean
}): SignalQualityMetrics {
  let score = 0
  const weights = {
    confidence: 0.30,
    confluence: 0.20,
    trend: 0.15,
    volatility: 0.10,
    news: 0.10,
    rr: 0.10,
    session: 0.05
  }
  
  // Confidence Score (0-30)
  score += (params.confidence / 100) * (weights.confidence * 100)
  
  // Confluence Score (0-20)
  const confluenceScore = Math.min(params.confluenceCount / 5, 1) * (weights.confluence * 100)
  score += confluenceScore
  
  // Trend Alignment (0-15)
  const trendScore = params.trendAlignment ? (weights.trend * 100) : 0
  score += trendScore
  
  // Volatility Score (0-10)
  const volatilityRatio = params.atr / params.avgATR
  const volatilityScore = volatilityRatio >= 0.7 && volatilityRatio <= 1.5 
    ? (weights.volatility * 100) 
    : (weights.volatility * 100) * 0.5
  score += volatilityScore
  
  // News Risk Score (0-10)
  const newsScore = params.newsRisk === 'LOW' 
    ? (weights.news * 100)
    : params.newsRisk === 'MEDIUM'
    ? (weights.news * 100) * 0.5
    : 0
  score += newsScore
  
  // Risk-Reward Score (0-10)
  const rrScore = params.riskReward >= 2 
    ? (weights.rr * 100)
    : params.riskReward >= 1.5
    ? (weights.rr * 100) * 0.7
    : (weights.rr * 100) * 0.3
  score += rrScore
  
  // Session Score (0-5)
  const sessionScore = params.sessionActive ? (weights.session * 100) : 0
  score += sessionScore
  
  // Determine Tier
  let tier: 'PREMIUM' | 'STANDARD' | 'FILTERED' = 'FILTERED'
  let recommendation: 'TAKE' | 'REDUCE' | 'SKIP' = 'SKIP'
  
  if (score >= 75 && params.confidence >= 75 && params.riskReward >= 2) {
    tier = 'PREMIUM'
    recommendation = 'TAKE'
  } else if (score >= 60 && params.confidence >= 65 && params.riskReward >= 1.5) {
    tier = 'STANDARD'
    recommendation = 'REDUCE'
  } else {
    tier = 'FILTERED'
    recommendation = 'SKIP'
  }
  
  return {
    overallScore: Math.round(score),
    confluenceScore: Math.round(confluenceScore),
    trendAlignment: trendScore,
    volatilityScore: Math.round(volatilityScore),
    newsRiskScore: Math.round(newsScore),
    technicalStrength: Math.round((score - newsScore) / 9 * 10),
    tier,
    recommendation
  }
}

/**
 * Multi-Timeframe Confirmation
 * Checks if signal aligns across multiple timeframes
 */
export function checkMultiTimeframeAlignment(signals: {
  m15?: 'BUY' | 'SELL' | 'WAIT'
  h1?: 'BUY' | 'SELL' | 'WAIT'
  h4?: 'BUY' | 'SELL' | 'WAIT'
  d1?: 'BUY' | 'SELL' | 'WAIT'
}): {
  aligned: boolean
  strength: number
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
} {
  const timeframes = Object.values(signals).filter(s => s !== 'WAIT')
  
  if (timeframes.length === 0) {
    return { aligned: false, strength: 0, direction: 'NEUTRAL' }
  }
  
  const buyCount = timeframes.filter(s => s === 'BUY').length
  const sellCount = timeframes.filter(s => s === 'SELL').length
  
  const direction = buyCount > sellCount ? 'BUY' : sellCount > buyCount ? 'SELL' : 'NEUTRAL'
  const agreement = Math.max(buyCount, sellCount) / timeframes.length
  const aligned = agreement >= 0.75  // 75% agreement required
  
  return {
    aligned,
    strength: Math.round(agreement * 100),
    direction
  }
}

/**
 * Dynamic Stop Loss Adjustment
 * Adjusts SL based on volatility and market conditions
 */
export function calculateDynamicStopLoss(
  entry: number,
  direction: 'BUY' | 'SELL',
  atr: number,
  support: number,
  resistance: number,
  atrMultiplier: number = 1.5
): {
  stopLoss: number
  type: 'ATR' | 'STRUCTURE' | 'HYBRID'
  buffer: number
} {
  const atrSL = direction === 'BUY' 
    ? entry - (atr * atrMultiplier)
    : entry + (atr * atrMultiplier)
  
  const structureSL = direction === 'BUY' 
    ? support - (atr * 0.2)  // Slight buffer below support
    : resistance + (atr * 0.2)  // Slight buffer above resistance
  
  // Choose the safer (wider) stop
  let stopLoss: number
  let type: 'ATR' | 'STRUCTURE' | 'HYBRID'
  
  if (direction === 'BUY') {
    if (structureSL > atrSL) {
      stopLoss = structureSL
      type = 'STRUCTURE'
    } else {
      stopLoss = atrSL
      type = 'ATR'
    }
  } else {
    if (structureSL < atrSL) {
      stopLoss = structureSL
      type = 'STRUCTURE'
    } else {
      stopLoss = atrSL
      type = 'ATR'
    }
  }
  
  const buffer = Math.abs(entry - stopLoss)
  
  return { stopLoss, type, buffer }
}

/**
 * Take Profit Ladder
 * Multiple TP levels for partial profit taking
 */
export function calculateTakeProfitLadder(
  entry: number,
  direction: 'BUY' | 'SELL',
  atr: number,
  riskAmount: number
): {
  tp1: { price: number; percentage: number; rr: number }
  tp2: { price: number; percentage: number; rr: number }
  tp3: { price: number; percentage: number; rr: number }
} {
  const multipliers = [2, 3.5, 5.5]  // Conservative R:R ratios
  
  return {
    tp1: {
      price: direction === 'BUY' ? entry + (atr * multipliers[0]) : entry - (atr * multipliers[0]),
      percentage: 40,  // Take 40% profit at TP1
      rr: multipliers[0]
    },
    tp2: {
      price: direction === 'BUY' ? entry + (atr * multipliers[1]) : entry - (atr * multipliers[1]),
      percentage: 35,  // Take 35% profit at TP2
      rr: multipliers[1]
    },
    tp3: {
      price: direction === 'BUY' ? entry + (atr * multipliers[2]) : entry - (atr * multipliers[2]),
      percentage: 25,  // Let 25% run to TP3
      rr: multipliers[2]
    }
  }
}

/**
 * Trade Correlation Check
 * Prevents overexposure to correlated assets
 */
export function checkTradeCorrelation(
  existingTrades: Array<{ asset: string; direction: 'BUY' | 'SELL' }>,
  newTrade: { asset: string; direction: 'BUY' | 'SELL' }
): {
  allowed: boolean
  correlationRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
} {
  const correlatedAssets: Record<string, string[]> = {
    'XAU/USD': ['XAG/USD', 'GDX', 'GDXJ'],  // Gold correlates with silver, gold miners
    'EUR/USD': ['GBP/USD', 'AUD/USD'],
    'USD/JPY': ['USD/CHF'],
  }
  
  const related = correlatedAssets[newTrade.asset] || []
  const correlatedTrades = existingTrades.filter(t => 
    related.includes(t.asset) && t.direction === newTrade.direction
  )
  
  if (correlatedTrades.length >= 2) {
    return {
      allowed: false,
      correlationRisk: 'HIGH',
      reason: `Already holding ${correlatedTrades.length} correlated ${newTrade.direction} positions`
    }
  }
  
  if (correlatedTrades.length === 1) {
    return {
      allowed: true,
      correlationRisk: 'MEDIUM',
      reason: 'One correlated position exists - proceed with caution'
    }
  }
  
  return {
    allowed: true,
    correlationRisk: 'LOW',
    reason: 'No correlation risk detected'
  }
}

/**
 * Max Drawdown Protection
 * Halts trading if drawdown exceeds threshold
 */
export function checkDrawdownLimit(
  accountBalance: number,
  peakBalance: number,
  maxDrawdownPercent: number = 0.10  // 10% max drawdown
): {
  tradingAllowed: boolean
  currentDrawdown: number
  remaining: number
} {
  const drawdown = (peakBalance - accountBalance) / peakBalance
  const tradingAllowed = drawdown < maxDrawdownPercent
  
  return {
    tradingAllowed,
    currentDrawdown: Math.round(drawdown * 100),
    remaining: Math.round((maxDrawdownPercent - drawdown) * 100)
  }
}
