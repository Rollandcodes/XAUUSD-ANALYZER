// lib/news.ts — Economic news and fundamental analysis
const API_KEY = () => process.env.JBLANKED_API_KEY!
const BASE = 'https://economic-calendar.tradingeconomics.com/events'

export interface NewsEvent {
  Name: string
  Currency: string
  Category: string
  Impact: 'High' | 'Medium' | 'Low' | 'None'
  Date: string
  Actual: number | null
  Forecast: number | null
  Previous: number | null
  Outcome: string
  Strength: string
  Quality: string
}

export interface NewsRisk {
  level: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN'
  label: string
  reason: string
  avoid: boolean
  events: NewsEvent[]
}

export interface NewsBias {
  bias: 'BULLISH_GOLD' | 'BEARISH_GOLD' | 'NEUTRAL'
  score: number
  summary: string
}

export async function fetchTodayNews(): Promise<NewsEvent[]> {
  try {
    // Placeholder: implement real news API integration
    return getMockNews()
  } catch {
    return getMockNews()
  }
}

export async function fetchWeekNews(): Promise<NewsEvent[]> {
  try {
    return getMockNews()
  } catch {
    return getMockNews()
  }
}

export function assessNewsRisk(events: NewsEvent[]): NewsRisk {
  const highImpact = events.filter(e => e.Impact === 'High' && e.Currency === 'USD')
  
  if (highImpact.length > 0) {
    return {
      level: 'ORANGE',
      label: 'MODERATE RISK',
      reason: `${highImpact.length} high-impact USD event(s) pending`,
      avoid: false,
      events: highImpact
    }
  }
  
  return {
    level: 'GREEN',
    label: 'LOW RISK',
    reason: 'No major news events imminent',
    avoid: false,
    events: []
  }
}

export function computeNewsBias(events: NewsEvent[]): NewsBias {
  const usdEvents = events.filter(e => e.Currency === 'USD' && e.Impact === 'High')
  
  if (usdEvents.length === 0) {
    return {
      bias: 'NEUTRAL',
      score: 0,
      summary: 'Neutral fundamental backdrop — no major USD catalysts'
    }
  }
  
  // Simple heuristic: positive USD data = bearish gold, negative USD data = bullish gold
  let score = 0
  usdEvents.forEach(e => {
    if (e.Actual !== null && e.Forecast !== null) {
      if (e.Actual > e.Forecast) score -= 1 // USD strength
      else if (e.Actual < e.Forecast) score += 1 // USD weakness
    }
  })
  
  if (score > 0) {
    return {
      bias: 'BULLISH_GOLD',
      score,
      summary: 'USD weakness detected in recent data — gold bullish fundamentals'
    }
  } else if (score < 0) {
    return {
      bias: 'BEARISH_GOLD',
      score,
      summary: 'USD strength detected in recent data — gold bearish fundamentals'
    }
  }
  
  return {
    bias: 'NEUTRAL',
    score: 0,
    summary: 'Mixed USD data — neutral gold fundamental bias'
  }
}

function getMockNews(): NewsEvent[] {
  return [
    {
      Name: 'Non-Farm Payrolls',
      Currency: 'USD',
      Category: 'Employment',
      Impact: 'High',
      Date: new Date().toISOString(),
      Actual: null,
      Forecast: 180000,
      Previous: 175000,
      Outcome: 'pending',
      Strength: 'high',
      Quality: 'A'
    },
    {
      Name: 'Federal Funds Rate',
      Currency: 'USD',
      Category: 'Central Bank',
      Impact: 'High',
      Date: new Date(Date.now() + 86400000).toISOString(),
      Actual: null,
      Forecast: 5.25,
      Previous: 5.25,
      Outcome: 'pending',
      Strength: 'high',
      Quality: 'A'
    }
  ]
}
