// lib/analysis.ts — ICT Technical Analysis
import type { Candle } from './twelvedata'

export interface AMDPhase {
  phase: string
  description: string
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  sessionHigh: number
  sessionLow: number
  asiaHigh?: number
  asiaLow?: number
  manipulation: string
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
}

export interface FVG {
  id: string
  type: 'BULLISH' | 'BEARISH'
  top: number
  bottom: number
  size: number
  midpoint: number
}

export interface SRLevel {
  price: number
  type: string
  touches: number
  strength: number
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
}

export function detectAMD(candles: Candle[], interval: string): AMDPhase {
  const latest = candles[candles.length - 1]
  const sessionHigh = Math.max(...candles.slice(-20).map(c => c.high))
  const sessionLow = Math.min(...candles.slice(-20).map(c => c.low))
  
  return {
    phase: 'ACCUMULATION',
    description: 'Market consolidating, awaiting directional bias confirmation',
    bias: latest.close > (sessionHigh + sessionLow) / 2 ? 'BULLISH' : 'BEARISH',
    sessionHigh,
    sessionLow,
    manipulation: 'Monitoring for liquidity sweep'
  }
}

export function detectOrderBlocks(candles: Candle[]): OrderBlock[] {
  const blocks: OrderBlock[] = []
  
  for (let i = 2; i < candles.length - 1; i++) {
    const prev = candles[i - 1]
    const curr = candles[i]
    const next = candles[i + 1]
    
    // Bullish OB: down candle followed by strong up move
    if (curr.close < curr.open && next.close > next.open && (next.close - next.open) > (curr.open - curr.close) * 1.5) {
      blocks.push({
        id: `OB_BULL_${i}`,
        type: 'BULLISH',
        top: curr.open,
        bottom: curr.close,
        bodyTop: curr.open,
        bodyBottom: curr.close,
        time: curr.time,
        strength: 'MODERATE'
      })
    }
    
    // Bearish OB: up candle followed by strong down move
    if (curr.close > curr.open && next.close < next.open && (next.open - next.close) > (curr.close - curr.open) * 1.5) {
      blocks.push({
        id: `OB_BEAR_${i}`,
        type: 'BEARISH',
        top: curr.close,
        bottom: curr.open,
        bodyTop: curr.close,
        bodyBottom: curr.open,
        time: curr.time,
        strength: 'MODERATE'
      })
    }
  }
  
  return blocks.slice(-5)
}

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
        midpoint: (next.low + prev.high) / 2
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
        midpoint: (prev.low + next.high) / 2
      })
    }
  }
  
  return fvgs.slice(-3)
}

export function detectSRLevels(candles: Candle[]): SRLevel[] {
  const levels: SRLevel[] = []
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  
  const maxHigh = Math.max(...highs)
  const minLow = Math.min(...lows)
  
  levels.push({ price: maxHigh, type: 'RESISTANCE_MAJOR', touches: 3, strength: 0.9 })
  levels.push({ price: minLow, type: 'SUPPORT_MAJOR', touches: 3, strength: 0.9 })
  
  return levels
}

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
  let confidence = 50
  const confluences: string[] = []
  
  // Simple signal logic
  if (rsi < 30 && macd.histogram > 0 && amd.bias === 'BULLISH') {
    action = 'BUY'
    confidence = 75
    confluences.push('RSI oversold + MACD bullish + AMD accumulation bias')
  } else if (rsi > 70 && macd.histogram < 0 && amd.bias === 'BEARISH') {
    action = 'SELL'
    confidence = 75
    confluences.push('RSI overbought + MACD bearish + AMD distribution bias')
  }
  
  const entry = price
  const sl = action === 'BUY' ? price - atr * 1.5 : price + atr * 1.5
  const tp1 = action === 'BUY' ? price + atr * 2 : price - atr * 2
  const tp2 = action === 'BUY' ? price + atr * 3 : price - atr * 3
  const tp3 = action === 'BUY' ? price + atr * 4 : price - atr * 4
  
  return {
    action,
    confidence,
    entry,
    entryZone: [entry - 5, entry + 5],
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
    invalidation: action === 'BUY' ? `Price below ${sl.toFixed(2)}` : `Price above ${sl.toFixed(2)}`,
    sessionBias: amd.bias
  }
}
