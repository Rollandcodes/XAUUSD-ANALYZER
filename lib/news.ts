// lib/news.ts — Enhanced Economic News and Fundamental Analysis
const JBLANKED_API_KEY = () => process.env.JBLANKED_API_KEY!
// Trading Economics API base
const TE_BASE = 'https://api.tradingeconomics.com'

export interface NewsEvent {
  ID: string
  Country: string
  Currency: string
  Category: string
  Event: string
  Date: string
  Actual: number | null
  Forecast: number | null
  Previous: number | null
  Impact: 'High' | 'Medium' | 'Low' | 'None'
  Period: string
  Unit: string | null
  Outcome: string
  Ticker: string | null
}

export interface NewsRisk {
  level: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN'
  label: string
  reason: string
  avoid: boolean
  events: NewsEvent[]
  upcomingCount: number
}

export interface NewsBias {
  bias: 'BULLISH_GOLD' | 'BEARISH_GOLD' | 'NEUTRAL'
  score: number
  summary: string
  factors: string[]
}

export interface MacroCorrelation {
  asset: string
  correlation: number // -1 to 1
  description: string
}

export interface EventImpact {
  event: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  historicalGoldMove: number // average pip movement
  direction: 'BULLISH' | 'BEARISH' | 'MIXED'
  reliability: number // 0-100
}

export interface SentimentAnalysis {
  overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  score: number // -100 to 100
  headlines: { text: string; sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' }[]
  summary: string
}

// ==================== NEWS FETCHING ====================

export async function fetchTodayNews(): Promise<NewsEvent[]> {
  try {
    // Try Trading Economics API first
    if (JBLANKED_API_KEY()) {
      const news = await fetchTradingEconomicsNews()
      if (news.length > 0) return news
    }
    return getMockNews()
  } catch (err) {
    console.warn('[news] fetch failed, using mock data:', err)
    return getMockNews()
  }
}

export async function fetchWeekNews(): Promise<NewsEvent[]> {
  try {
    if (JBLANKED_API_KEY()) {
      const news = await fetchTradingEconomicsNews(true)
      if (news.length > 0) return news
    }
    return getMockNews()
  } catch {
    return getMockNews()
  }
}

async function fetchTradingEconomicsNews(week: boolean = false): Promise<NewsEvent[]> {
  const apiKey = JBLANKED_API_KEY()
  if (!apiKey) return []

  const days = week ? 7 : 1
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  try {
    // Using Trading Economics calendar API
    const url = `${TE_BASE}/calendar?c=${apiKey}&d=${startStr}`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    })

    if (!res.ok) {
      console.warn('[news] TE API error:', res.status)
      return []
    }

    const data = await res.json()

    if (!Array.isArray(data)) return []

    // Filter for USD and gold-relevant events
    const filtered: NewsEvent[] = data
      .filter((e: any) => {
        const currency = e.Currency || ''
        const impact = e.Impact || ''
        return (currency === 'USD' || currency === 'XAU' || currency === 'EUR' || currency === 'GBP') &&
          (impact === 'High' || impact === 'Medium')
      })
      .map((e: any) => ({
        ID: e.ID || Math.random().toString(),
        Country: e.Country || '',
        Currency: e.Currency || '',
        Category: e.Category || '',
        Event: e.Event || '',
        Date: e.Date || e.date || new Date().toISOString(),
        Actual: e.Actual !== undefined ? parseFloat(e.Actual) : null,
        Forecast: e.Forecast !== undefined ? parseFloat(e.Forecast) : null,
        Previous: e.Previous !== undefined ? parseFloat(e.Previous) : null,
        Impact: e.Impact || 'Low',
        Period: e.Period || '',
        Unit: e.Unit || null,
        Outcome: e.Outcome || 'pending',
        Ticker: e.Ticker || null
      }))
      .slice(0, 30)

    return filtered
  } catch (err) {
    console.warn('[news] TE fetch error:', err)
    return []
  }
}

// ==================== NEWS RISK ASSESSMENT ====================

export function assessNewsRisk(events: NewsEvent[]): NewsRisk {
  const now = new Date()
  const highImpactUSD = events.filter(e =>
    e.Currency === 'USD' && e.Impact === 'High'
  )

  // Check for events happening within next 4 hours
  const upcomingSoon = highImpactUSD.filter(e => {
    const eventTime = new Date(e.Date)
    const hoursUntil = (eventTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntil > 0 && hoursUntil <= 4
  })

  // Check for events happening today
  const today = events.filter(e => {
    const eventDate = new Date(e.Date)
    return eventDate.toDateString() === now.toDateString() &&
      e.Currency === 'USD' && e.Impact === 'High'
  })

  if (upcomingSoon.length > 1) {
    return {
      level: 'RED',
      label: 'HIGH RISK',
      reason: `${upcomingSoon.length} high-impact USD events within 4 hours`,
      avoid: true,
      events: upcomingSoon,
      upcomingCount: upcomingSoon.length
    }
  }

  if (upcomingSoon.length === 1) {
    return {
      level: 'ORANGE',
      label: 'MODERATE RISK',
      reason: `${upcomingSoon[0].Event} at ${formatTime(new Date(upcomingSoon[0].Date))}`,
      avoid: false,
      events: upcomingSoon,
      upcomingCount: upcomingSoon.length
    }
  }

  if (today.length > 0) {
    return {
      level: 'YELLOW',
      label: 'LOW-MODERATE RISK',
      reason: `${today.length} high-impact USD event(s) today`,
      avoid: false,
      events: today,
      upcomingCount: today.length
    }
  }

  return {
    level: 'GREEN',
    label: 'LOW RISK',
    reason: 'No major news events imminent',
    avoid: false,
    events: [],
    upcomingCount: 0
  }
}

// ==================== NEWS BIAS COMPUTATION ====================

export function computeNewsBias(events: NewsEvent[]): NewsBias {
  const usdEvents = events.filter(e => e.Currency === 'USD' && e.Impact === 'High')
  const eurEvents = events.filter(e => e.Currency === 'EUR' && e.Impact === 'High')
  const factors: string[] = []

  if (usdEvents.length === 0 && eurEvents.length === 0) {
    return {
      bias: 'NEUTRAL',
      score: 0,
      summary: 'No major USD/EUR catalysts — neutral fundamental backdrop',
      factors: []
    }
  }

  let score = 0

  // Analyze USD events
  usdEvents.forEach(e => {
    if (e.Actual !== null && e.Forecast !== null) {
      const surprise = e.Actual - e.Forecast

      // Positive surprise = USD strength = bearish for gold
      if (surprise > 0) {
        score -= Math.min(Math.abs(surprise) * 2, 3)
        factors.push(`${e.Event}: USD stronger than expected`)
      }
      // Negative surprise = USD weakness = bullish for gold
      else if (surprise < 0) {
        score += Math.min(Math.abs(surprise) * 2, 3)
        factors.push(`${e.Event}: USD weaker than expected`)
      }
    }
  })

  // Analyze EUR events (inverse correlation with USD)
  eurEvents.forEach(e => {
    if (e.Actual !== null && e.Forecast !== null) {
      const surprise = e.Actual - e.Forecast

      // Positive EUR surprise = EUR strength = USD weakness = bullish gold
      if (surprise > 0) {
        score += Math.min(Math.abs(surprise) * 1.5, 2)
        factors.push(`${e.Event}: EUR stronger than expected`)
      }
      // Negative EUR surprise = EUR weakness = USD strength = bearish gold
      else if (surprise < 0) {
        score -= Math.min(Math.abs(surprise) * 1.5, 2)
        factors.push(`${e.Event}: EUR weaker than expected`)
      }
    }
  })

  // Determine bias
  if (score > 1) {
    return {
      bias: 'BULLISH_GOLD',
      score,
      summary: `Gold bullish fundamentals: USD weakness detected (score: ${score.toFixed(1)})`,
      factors
    }
  } else if (score < -1) {
    return {
      bias: 'BEARISH_GOLD',
      score,
      summary: `Gold bearish fundamentals: USD strength detected (score: ${score.toFixed(1)})`,
      factors
    }
  }

  return {
    bias: 'NEUTRAL',
    score,
    summary: 'Mixed fundamentals — no clear directional bias',
    factors
  }
}

// ==================== MACRO CORRELATIONS ====================

export function getMacroCorrelations(price: number): MacroCorrelation[] {
  // Simplified macro correlations for gold
  // In production, these would be calculated from actual data

  return [
    {
      asset: 'US Dollar Index (DXY)',
      correlation: -0.75, // Gold inversely correlated with USD
      description: 'Strong inverse relationship — USD strength typically pressures gold'
    },
    {
      asset: 'US 10-Year Yields',
      correlation: -0.65,
      description: 'Higher yields increase opportunity cost of holding gold'
    },
    {
      asset: 'S&P 500',
      correlation: 0.15,
      description: 'Weak positive correlation — mixed safe-haven dynamics'
    },
    {
      asset: 'Silver (XAG/USD)',
      correlation: 0.85,
      description: 'Strong positive correlation — often move together'
    },
    {
      asset: 'USD/JPY',
      correlation: -0.45,
      description: 'Negative correlation via USD component'
    }
  ]
}

// ==================== EVENT IMPACT SCORING ====================

const KNOWN_HIGH_IMPACT_EVENTS: Record<string, EventImpact> = {
  'Non-Farm Payrolls': {
    event: 'Non-Farm Payrolls',
    impact: 'HIGH',
    historicalGoldMove: 25, // pips
    direction: 'MIXED',
    reliability: 85
  },
  'Federal Funds Rate': {
    event: 'Federal Funds Rate',
    impact: 'HIGH',
    historicalGoldMove: 30,
    direction: 'MIXED',
    reliability: 90
  },
  'CPI': {
    event: 'Consumer Price Index',
    impact: 'HIGH',
    historicalGoldMove: 20,
    direction: 'MIXED',
    reliability: 80
  },
  'GDP': {
    event: 'Gross Domestic Product',
    impact: 'HIGH',
    historicalGoldMove: 18,
    direction: 'MIXED',
    reliability: 75
  },
  'FOMC Minutes': {
    event: 'FOMC Minutes',
    impact: 'HIGH',
    historicalGoldMove: 15,
    direction: 'MIXED',
    reliability: 70
  },
  'Unemployment': {
    event: 'Unemployment Rate',
    impact: 'HIGH',
    historicalGoldMove: 15,
    direction: 'MIXED',
    reliability: 75
  },
  'Retail Sales': {
    event: 'Retail Sales',
    impact: 'HIGH',
    historicalGoldMove: 12,
    direction: 'MIXED',
    reliability: 65
  },
  'ISM Manufacturing': {
    event: 'ISM Manufacturing PMI',
    impact: 'HIGH',
    historicalGoldMove: 10,
    direction: 'MIXED',
    reliability: 60
  }
}

export function getEventImpact(eventName: string): EventImpact | null {
  // Try to match event name
  for (const key of Object.keys(KNOWN_HIGH_IMPACT_EVENTS)) {
    if (eventName.toLowerCase().includes(key.toLowerCase())) {
      return KNOWN_HIGH_IMPACT_EVENTS[key]
    }
  }

  return null
}

export function rateEventsByImpact(events: NewsEvent[]): EventImpact[] {
  const impacts: EventImpact[] = []

  events.forEach(event => {
    const impact = getEventImpact(event.Event)
    if (impact) {
      impacts.push(impact)
    }
  })

  return impacts.sort((a, b) => b.reliability - a.reliability)
}

// ==================== SENTIMENT ANALYSIS (with Claude) ====================

export async function analyzeSentiment(headlines: string[]): Promise<SentimentAnalysis> {
  if (headlines.length === 0) {
    return {
      overall: 'NEUTRAL',
      score: 0,
      headlines: [],
      summary: 'No headlines available for sentiment analysis'
    }
  }

  // Try to use Claude for sentiment analysis
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          temperature: 0.3,
          system: 'You are a financial sentiment analyzer. Analyze gold market headlines and determine sentiment. Return JSON with: overall (BULLISH/BEARISH/NEUTRAL), score (-100 to 100), and summary.',
          messages: [{
            role: 'user',
            content: `Analyze these gold/XAU market headlines for sentiment:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\nReturn JSON: {"overall": "...", "score": number, "summary": "..."}`
          }]
        })
      })

      if (res.ok) {
        const data = await res.json()
        const content = data.content?.[0]?.text || ''

        // Try to parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            overall: parsed.overall || 'NEUTRAL',
            score: parsed.score || 0,
            headlines: headlines.map(h => ({
              text: h,
              sentiment: 'NEUTRAL' as const
            })),
            summary: parsed.summary || 'Sentiment analysis complete'
          }
        }
      }
    } catch (err) {
      console.warn('[sentiment] Claude analysis failed:', err)
    }
  }

  // Fallback: simple keyword-based sentiment
  return simpleSentimentAnalysis(headlines)
}

function simpleSentimentAnalysis(headlines: string[]): SentimentAnalysis {
  const bullishKeywords = ['rise', 'gain', 'surge', 'bullish', 'strong', 'growth', 'positive', 'higher', 'up', 'rally']
  const bearishKeywords = ['fall', 'drop', 'decline', 'bearish', 'weak', 'negative', 'lower', 'down', 'sell', 'cut']

  let score = 0
  const analyzed = headlines.map(h => {
    const lower = h.toLowerCase()
    const isBullish = bullishKeywords.some(k => lower.includes(k))
    const isBearish = bearishKeywords.some(k => lower.includes(k))

    if (isBullish && !isBearish) {
      score += 20
      return { text: h, sentiment: 'POSITIVE' as const }
    }
    if (isBearish && !isBullish) {
      score -= 20
      return { text: h, sentiment: 'NEGATIVE' as const }
    }
    return { text: h, sentiment: 'NEUTRAL' as const }
  })

  // Normalize score
  score = Math.max(-100, Math.min(100, score))

  let overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'
  if (score > 20) overall = 'BULLISH'
  else if (score < -20) overall = 'BEARISH'

  return {
    overall,
    score,
    headlines: analyzed,
    summary: overall === 'NEUTRAL'
      ? 'Mixed sentiment across headlines'
      : overall === 'BULLISH'
        ? 'Overall bullish sentiment detected'
        : 'Overall bearish sentiment detected'
  }
}

// ==================== HELPER FUNCTIONS ====================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ==================== MOCK DATA ====================

function getMockNews(): NewsEvent[] {
  const now = new Date()
  const events: NewsEvent[] = [
    {
      ID: '1',
      Country: 'United States',
      Currency: 'USD',
      Category: 'Employment',
      Event: 'Non-Farm Payrolls',
      Date: new Date(now.getTime() + 86400000 * 2).toISOString(),
      Actual: null,
      Forecast: 180000,
      Previous: 175000,
      Impact: 'High',
      Period: 'January 2026',
      Unit: 'K',
      Outcome: 'pending',
      Ticker: 'NFP'
    },
    {
      ID: '2',
      Country: 'United States',
      Currency: 'USD',
      Category: 'Central Bank',
      Event: 'Federal Funds Rate',
      Date: new Date(now.getTime() + 86400000 * 5).toISOString(),
      Actual: null,
      Forecast: 5.25,
      Previous: 5.25,
      Impact: 'High',
      Period: 'February 2026',
      Unit: '%',
      Outcome: 'pending',
      Ticker: 'FEDRATE'
    },
    {
      ID: '3',
      Country: 'United States',
      Currency: 'USD',
      Category: 'Inflation',
      Event: 'CPI (YoY)',
      Date: new Date(now.getTime() + 86400000 * 3).toISOString(),
      Actual: null,
      Forecast: 2.9,
      Previous: 2.8,
      Impact: 'High',
      Period: 'January 2026',
      Unit: '%',
      Outcome: 'pending',
      Ticker: 'CPIYOY'
    },
    {
      ID: '4',
      Country: 'United States',
      Currency: 'USD',
      Category: 'GDP',
      Event: 'GDP (QoQ)',
      Date: new Date(now.getTime() + 86400000 * 4).toISOString(),
      Actual: null,
      Forecast: 2.3,
      Previous: 2.5,
      Impact: 'High',
      Period: 'Q4 2025',
      Unit: '%',
      Outcome: 'pending',
      Ticker: 'GDP'
    }
  ]

  return events
}
