// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchCandlesWithProvider, fetchQuoteWithProvider, fetchRSI, fetchMACD, fetchBBands, fetchATR } from '@/lib/twelvedata'
import {
  detectAMD,
  detectOrderBlocks,
  detectFVGs,
  detectSRLevels,
  buildSignal,
  detectLiquidityZones,
  detectPatterns,
  getCurrentSession,
  getSessionName,
  analyzeMultiTimeframe,
  type MTAResult,
  type Pattern,
  type LiquidityZone
} from '@/lib/analysis'
import { generateGoldNarrative as generateGoldNarrativeOpenAI, generateDeepAnalysis as generateDeepAnalysisOpenAI } from '@/lib/openai'
import { generateGoldNarrative as generateGoldNarrativeAnthropic, generateDeepAnalysis as generateDeepAnalysisAnthropic } from '@/lib/anthropic'
import {
  fetchTodayNews,
  fetchWeekNews,
  assessNewsRisk,
  computeNewsBias,
  getMacroCorrelations,
  rateEventsByImpact,
  type MacroCorrelation
} from '@/lib/news'
import { fetchGoldSpot, fetchGoldWeekHistory, computeSpotInsights } from '@/lib/goldapi'
import { generatePriceActionSignal, type PriceActionSignal } from '@/lib/priceaction'

const DEFAULT_SYMBOL = 'XAU/USD'
const ALLOWED_INTERVALS = new Set(['15min', '1h', '4h', '1day'])

function normalizeSymbolInput(input: unknown): string {
  if (typeof input !== 'string' || !input.trim()) return DEFAULT_SYMBOL
  const cleaned = input.trim().toUpperCase().replace(/[-_\s]/g, '')
  if (cleaned === 'GOLD' || cleaned === 'XAUUSD' || cleaned === 'XAUUS$') return 'XAU/USD'
  if (cleaned === 'XAU/USD'.replace('/', '')) return 'XAU/USD'
  return input.trim().toUpperCase()
}

// Prefer OpenAI if key present, fallback to Anthropic
const useOpenAI = !!process.env.OPENAI_API_KEY
const generateGoldNarrative = useOpenAI ? generateGoldNarrativeOpenAI : generateGoldNarrativeAnthropic
const generateDeepAnalysis = useOpenAI ? generateDeepAnalysisOpenAI : generateDeepAnalysisAnthropic

// Combine ICT and Price Action signals
function combineSignals(ictSignal: any, paSignal: PriceActionSignal, atr: number): any {
  const ictAction = ictSignal.action
  const paAction = paSignal.action
  
  // If both agree, boost confidence significantly
  if (ictAction === paAction && ictAction !== 'WAIT') {
    const combinedConfidence = Math.min(95, (ictSignal.confidence * 0.6 + paSignal.confidence * 0.4))
    const avgEntry = (ictSignal.entry + paSignal.entry) / 2
    const avgTP1 = (ictSignal.tp1 + paSignal.takeProfit1) / 2
    const avgSL = (ictSignal.stopLoss + paSignal.stopLoss) / 2
    
    return {
      ...ictSignal,
      action: ictAction,
      confidence: combinedConfidence,
      entry: avgEntry,
      tp1: avgTP1,
      stopLoss: avgSL,
      rr1: Math.abs(avgTP1 - avgEntry) / Math.abs(avgSL - avgEntry),
      confluences: [
        ...ictSignal.confluences,
        `✓ PA Confirmation: ${paSignal.patterns.map(p => p.name).join(', ')}`,
        `✓ Combined ICT + PA Confidence: ${combinedConfidence.toFixed(0)}%`
      ],
      priceActionPatterns: paSignal.patterns.map(p => p.name)
    }
  }
  
  // If they conflict, reduce confidence and default to WAIT or stronger signal
  if (ictAction !== paAction && ictAction !== 'WAIT' && paAction !== 'WAIT') {
    return {
      ...ictSignal,
      action: 'WAIT',
      confidence: Math.min(ictSignal.confidence, paSignal.confidence) * 0.5,
      confluences: [
        ...ictSignal.confluences,
        `⚠ Signal Conflict: ICT ${ictAction} vs PA ${paAction} — waiting for clarity`
      ],
      priceActionPatterns: paSignal.patterns.map(p => p.name)
    }
  }
  
  // If one is WAIT, use the stronger signal but reduce confidence slightly
  if (ictAction === 'WAIT' && paAction !== 'WAIT') {
    return {
      ...ictSignal,
      action: paSignal.action,
      confidence: paSignal.confidence * 0.8,
      entry: paSignal.entry,
      tp1: paSignal.takeProfit1,
      stopLoss: paSignal.stopLoss,
      rr1: paSignal.riskReward,
      confluences: [
        `PA Signal: ${paSignal.action} (${paSignal.confidence.toFixed(0)}%)`,
        ...paSignal.confluences,
        `ICT showing consolidation/neutral`
      ],
      priceActionPatterns: paSignal.patterns.map(p => p.name)
    }
  }
  
  if (paAction === 'WAIT' && ictAction !== 'WAIT') {
    return {
      ...ictSignal,
      confluences: [
        ...ictSignal.confluences,
        `PA showing consolidation — ICT signal ${ictAction} at ${ictSignal.confidence.toFixed(0)}%`
      ],
      priceActionPatterns: paSignal.patterns.map(p => p.name)
    }
  }
  
  // Both WAIT
  return {
    ...ictSignal,
    confluences: [
      ...ictSignal.confluences,
      'PA + ICT agree: sideways/consolidation'
    ],
    priceActionPatterns: paSignal.patterns.map(p => p.name)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const interval = req.body?.interval ?? '1h'
  if (typeof interval !== 'string' || !ALLOWED_INTERVALS.has(interval)) {
    return res.status(400).json({ error: 'Invalid interval' })
  }
  const symbol = normalizeSymbolInput(req.body?.symbol)

  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')

    // Fetch everything in parallel — 4 data sources simultaneously
    const [quoteResult, candlesResult, rsi, macd, bbands, atr, todayNews, weekNews, goldSpot] = await Promise.all([
      fetchQuoteWithProvider(symbol),
      fetchCandlesWithProvider(symbol, interval, 150),
      fetchRSI(symbol, interval),
      fetchMACD(symbol, interval),
      fetchBBands(symbol, interval),
      fetchATR(symbol, interval),
      fetchTodayNews(),
      fetchWeekNews(),
      fetchGoldSpot(),            // GoldAPI.io — spot bid/ask/spread
    ])

    const quote = quoteResult.quote
    const candles = candlesResult.candles

    // Fetch weekly history separately (sequential, uses monthly API quota carefully)
    // Only fetch if goldSpot succeeded to avoid wasting quota
    const goldHistory = goldSpot ? await fetchGoldWeekHistory() : []
    const spotInsights = goldSpot ? computeSpotInsights(goldSpot, goldHistory) : null

    // Use GoldAPI price as price reference if available (it's more accurate for spot)
    // Fall back to provider-chain quote (Alpha Vantage / Marketstack / Finnhub / synthetic)
    const spotPrice = goldSpot?.price ?? quote.close

    // Run ICT analysis engine
    const amd         = detectAMD(candles, interval)
    const orderBlocks = detectOrderBlocks(candles)
    const fvgs        = detectFVGs(candles)
    const srLevels    = detectSRLevels(candles)
    const signal      = buildSignal(candles, rsi, macd, bbands, atr, amd, orderBlocks, fvgs, srLevels)

    // Enhanced analysis
    const liquidityZones = detectLiquidityZones(candles)
    const patterns = detectPatterns(candles)

    // Price Action Analysis - Candles are already in the correct format
    const priceActionSignal = generatePriceActionSignal(candles, spotPrice, atr)

    // Combine ICT + Price Action signals for hybrid confidence
    const hybridSignal = combineSignals(signal, priceActionSignal, atr)

    // Current trading session
    const currentSession = getCurrentSession()
    const sessionName = getSessionName(currentSession)

    // News analysis
    const newsRisk = assessNewsRisk(todayNews)
    const newsBias = computeNewsBias(todayNews)
    const eventImpacts = rateEventsByImpact(weekNews)

    // Macro correlations
    const macroCorrelations = getMacroCorrelations(spotPrice)

    // Spot insights influence signal
    if (spotInsights?.spreadQuality === 'WIDE' && hybridSignal.action !== 'WAIT') {
      hybridSignal.confidence = Math.max(20, hybridSignal.confidence - 10)
      hybridSignal.confluences.push(`⚠ Wide bid/ask spread (${goldSpot?.spread?.toFixed(2)}) — possible low liquidity`)
    }

    // Weekly position context
    if (spotInsights?.weeklyRange) {
      const pos = spotInsights.weeklyRange.positionPct
      if (hybridSignal.action === 'BUY' && pos > 80) {
        hybridSignal.confidence = Math.max(20, hybridSignal.confidence - 8)
        hybridSignal.confluences.push(`Price at ${pos}% of weekly range — near weekly high, BUY risk elevated`)
      }
      if (hybridSignal.action === 'SELL' && pos < 20) {
        hybridSignal.confidence = Math.max(20, hybridSignal.confidence - 8)
        hybridSignal.confluences.push(`Price at ${pos}% of weekly range — near weekly low, SELL risk elevated`)
      }
      if (hybridSignal.action === 'BUY' && pos < 30) {
        hybridSignal.confidence = Math.min(95, hybridSignal.confidence + 5)
        hybridSignal.confluences.push(`Buying near weekly low (${pos}% range) — discount zone`)
      }
      if (hybridSignal.action === 'SELL' && pos > 70) {
        hybridSignal.confidence = Math.min(95, hybridSignal.confidence + 5)
        hybridSignal.confluences.push(`Selling near weekly high (${pos}% range) — premium zone`)
      }
    }

    // News risk override
    if (newsRisk.avoid && hybridSignal.action !== 'WAIT') {
      hybridSignal.action     = 'WAIT'
      hybridSignal.confidence = Math.min(hybridSignal.confidence, 25)
      hybridSignal.confluences.push('BLOCKED: High-impact news imminent — protect capital')
    }

    if (newsBias.bias === 'BULLISH_GOLD' && hybridSignal.action === 'BUY') {
      hybridSignal.confidence = Math.min(95, hybridSignal.confidence + 10)
      hybridSignal.confluences.push('Fundamentals confirm: USD weakness → Gold bullish')
    } else if (newsBias.bias === 'BEARISH_GOLD' && hybridSignal.action === 'SELL') {
      hybridSignal.confidence = Math.min(95, hybridSignal.confidence + 10)
      hybridSignal.confluences.push('Fundamentals confirm: USD weakness → Gold bearish')
    } else if (
      (newsBias.bias === 'BULLISH_GOLD' && hybridSignal.action === 'SELL') ||
      (newsBias.bias === 'BEARISH_GOLD' && hybridSignal.action === 'BUY')
    ) {
      hybridSignal.confidence = Math.max(20, hybridSignal.confidence - 15)
      hybridSignal.confluences.push('WARNING: Fundamentals conflict with technical signal')
    }

    // Generate Claude narrative
    let narrative = ''
    let deepAnalysis = ''
    try {
      narrative = await generateGoldNarrative({
        price: spotPrice, signal: hybridSignal, amd, orderBlocks, fvgs, srLevels,
        rsi, macd, atr, interval, newsRisk, newsBias,
        goldSpot, spotInsights, priceActionSignal
      })

      // Generate deep analysis
      deepAnalysis = await generateDeepAnalysis({
        price: spotPrice, signal: hybridSignal, amd, orderBlocks, fvgs, srLevels,
        rsi, macd, bbands, atr, newsRisk, newsBias,
        goldSpot, spotInsights, liquidityZones, patterns, priceActionSignal
      })
    } catch (err) {
      console.warn('[narrative] generation failed:', err)
      narrative = amd.description
      deepAnalysis = narrative
    }

    const upcomingHighImpact = weekNews
      .filter(e => e.Impact === 'High' && e.Currency === 'USD')
      .filter(e => new Date(e.Date.replace(/\./g, '-').replace(' ', 'T') + 'Z') > new Date())
      .slice(0, 8)

    res.status(200).json({
      quote: { ...quote, close: spotPrice },  // prefer GoldAPI spot price
      candles, rsi, macd, bbands, atr,
      amd, orderBlocks, fvgs, srLevels, 
      signal: hybridSignal,  // Hybrid ICT + PA signal
      narrative, 
      deepAnalysis,
      // Price Action Analysis
      priceAction: {
        signal: priceActionSignal,
        patterns: priceActionSignal.patterns,
        chartPattern: priceActionSignal.chartPattern,
        wickAnalysis: priceActionSignal.wickAnalysis,
        confidence: priceActionSignal.confidence
      },
      // Enhanced ICT data
      liquidityZones,
      patterns,
      session: { current: currentSession, name: sessionName },
      eventImpacts,
      macroCorrelations,
      news: { today: todayNews.slice(0, 20), upcoming: upcomingHighImpact, risk: newsRisk, bias: newsBias },
      providerUsed: {
        candles: candlesResult.provider,
        quote: quoteResult.provider
      },
      spot: goldSpot ? { ...goldSpot, insights: spotInsights, history: goldHistory } : null,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    console.error('[gold analyze]', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    res.status(500).json({ error: message })
  }
}
