// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchCandles, fetchQuote, fetchRSI, fetchMACD, fetchBBands, fetchATR } from '@/lib/twelvedata'
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
import { generateGoldNarrative } from '@/lib/openai'
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

const SYMBOL = 'XAU/USD'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { interval = '1h' } = req.body

  try {
    // Fetch everything in parallel — 4 data sources simultaneously
    const [quote, candles, rsi, macd, bbands, atr, todayNews, weekNews, goldSpot] = await Promise.all([
      fetchQuote(SYMBOL),
      fetchCandles(SYMBOL, interval, 150),
      fetchRSI(SYMBOL, interval),
      fetchMACD(SYMBOL, interval),
      fetchBBands(SYMBOL, interval),
      fetchATR(SYMBOL, interval),
      fetchTodayNews(),
      fetchWeekNews(),
      fetchGoldSpot(),            // GoldAPI.io — spot bid/ask/spread
    ])

    // Fetch weekly history separately (sequential, uses monthly API quota carefully)
    // Only fetch if goldSpot succeeded to avoid wasting quota
    const goldHistory = goldSpot ? await fetchGoldWeekHistory() : []
    const spotInsights = goldSpot ? computeSpotInsights(goldSpot, goldHistory) : null

    // Use GoldAPI price as price reference if available (it's more accurate for spot)
    // Fall back to Twelve Data quote
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
    if (spotInsights?.spreadQuality === 'WIDE' && signal.action !== 'WAIT') {
      signal.confidence = Math.max(20, signal.confidence - 10)
      signal.confluences.push(`⚠ Wide bid/ask spread (${goldSpot?.spread?.toFixed(2)}) — possible low liquidity`)
    }

    // Weekly position context
    if (spotInsights?.weeklyRange) {
      const pos = spotInsights.weeklyRange.positionPct
      if (signal.action === 'BUY' && pos > 80) {
        signal.confidence = Math.max(20, signal.confidence - 8)
        signal.confluences.push(`Price at ${pos}% of weekly range — near weekly high, BUY risk elevated`)
      }
      if (signal.action === 'SELL' && pos < 20) {
        signal.confidence = Math.max(20, signal.confidence - 8)
        signal.confluences.push(`Price at ${pos}% of weekly range — near weekly low, SELL risk elevated`)
      }
      if (signal.action === 'BUY' && pos < 30) {
        signal.confidence = Math.min(95, signal.confidence + 5)
        signal.confluences.push(`Buying near weekly low (${pos}% range) — discount zone`)
      }
      if (signal.action === 'SELL' && pos > 70) {
        signal.confidence = Math.min(95, signal.confidence + 5)
        signal.confluences.push(`Selling near weekly high (${pos}% range) — premium zone`)
      }
    }

    // News risk override
    if (newsRisk.avoid && signal.action !== 'WAIT') {
      signal.action     = 'WAIT'
      signal.confidence = Math.min(signal.confidence, 25)
      signal.confluences.push('BLOCKED: High-impact news imminent — protect capital')
    }

    if (newsBias.bias === 'BULLISH_GOLD' && signal.action === 'BUY') {
      signal.confidence = Math.min(95, signal.confidence + 10)
      signal.confluences.push('Fundamentals confirm: USD weakness → Gold bullish')
    } else if (newsBias.bias === 'BEARISH_GOLD' && signal.action === 'SELL') {
      signal.confidence = Math.min(95, signal.confidence + 10)
      signal.confluences.push('Fundamentals confirm: USD strength → Gold bearish')
    } else if (
      (newsBias.bias === 'BULLISH_GOLD' && signal.action === 'SELL') ||
      (newsBias.bias === 'BEARISH_GOLD' && signal.action === 'BUY')
    ) {
      signal.confidence = Math.max(20, signal.confidence - 15)
      signal.confluences.push('WARNING: Fundamentals conflict with technical signal')
    }

    // Generate Claude narrative
    let narrative = ''
    let deepAnalysis = ''
    try {
      narrative = await generateGoldNarrative({
        price: spotPrice, signal, amd, orderBlocks, fvgs, srLevels,
        rsi, macd, atr, interval, newsRisk, newsBias,
        goldSpot, spotInsights,
      })

      // Generate deep analysis
      deepAnalysis = await generateDeepAnalysis({
        price: spotPrice, signal, amd, orderBlocks, fvgs, srLevels,
        rsi, macd, bbands, atr, newsRisk, newsBias,
        goldSpot, spotInsights, liquidityZones, patterns
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
      amd, orderBlocks, fvgs, srLevels, signal, narrative, deepAnalysis,
      // New enhanced data
      liquidityZones,
      patterns,
      session: { current: currentSession, name: sessionName },
      eventImpacts,
      macroCorrelations,
      news: { today: todayNews.slice(0, 20), upcoming: upcomingHighImpact, risk: newsRisk, bias: newsBias },
      spot: goldSpot ? { ...goldSpot, insights: spotInsights, history: goldHistory } : null,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[gold analyze]', err)
    res.status(500).json({ error: err.message ?? 'Analysis failed' })
  }
}
