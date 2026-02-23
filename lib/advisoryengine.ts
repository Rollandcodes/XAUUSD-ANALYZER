// lib/advisoryengine.ts - AI Financial Advisor & Strategic Guidance

export interface AdvisoryGuidance {
  recommendation: string
  category: 'ENTRY' | 'EXIT' | 'RISK' | 'STRATEGY' | 'PERFORMANCE'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  actionable: boolean
  confidence: number
  impact: string
}

export interface AdviceContext {
  winRate: number
  expectancy: number
  maxDrawdown: number
  sharpeRatio: number
  profitFactor: number
  consecutiveLosses: number
  accountBalance: number
  currentDrawdown: number
  timeOfDay: string
  dayOfWeek: string
  newsRisk: string
  volatility: number
  avgTimeframe: string
}

/**
 * Generate strategic trading guidance based on performance
 */
export function generateAdvisory(context: AdviceContext): AdvisoryGuidance[] {
  const advisories: AdvisoryGuidance[] = []

  // Win Rate Analysis
  if (context.winRate < 0.50) {
    advisories.push({
      recommendation: 'Your win rate is below 50%. Focus on improving entry accuracy. Review recent losing trades to identify patterns.',
      category: 'ENTRY',
      priority: 'HIGH',
      actionable: true,
      confidence: 90,
      impact: 'Critical to profitability'
    })
  } else if (context.winRate >= 0.65 && context.expectancy > 0) {
    advisories.push({
      recommendation: 'Excellent win rate! Consider scaling up position sizes gradually to maximize edge.',
      category: 'STRATEGY',
      priority: 'MEDIUM',
      actionable: true,
      confidence: 85,
      impact: 'Can increase returns'
    })
  }

  // Expectancy Analysis
  if (context.expectancy < 0) {
    advisories.push({
      recommendation: 'Negative expectancy detected. Avg loss exceeds avg win. Lower your stop losses or increase profit targets.',
      category: 'RISK',
      priority: 'HIGH',
      actionable: true,
      confidence: 88,
      impact: 'Currently unprofitable'
    })
  } else if (context.expectancy > 50) {
    advisories.push({
      recommendation: 'Strong positive expectancy! Your system is statistically profitable. Maintain discipline.',
      category: 'STRATEGY',
      priority: 'LOW',
      actionable: false,
      confidence: 92,
      impact: 'Good edge confirmed'
    })
  }

  // Drawdown Management
  if (context.maxDrawdown > 0.15) {
    advisories.push({
      recommendation: 'Maximum drawdown exceeds 15%. Consider reducing risk per trade to 0.5-1% of account.',
      category: 'RISK',
      priority: 'HIGH',
      actionable: true,
      confidence: 90,
      impact: 'Critical for account preservation'
    })
  }

  if (context.currentDrawdown > context.maxDrawdown * 0.8) {
    advisories.push({
      recommendation: 'Current drawdown approaching maximum limit. Exercise caution with new positions.',
      category: 'RISK',
      priority: 'HIGH',
      actionable: true,
      confidence: 95,
      impact: 'Immediate risk mitigation needed'
    })
  }

  // Consecutive Losses
  if (context.consecutiveLosses >= 3) {
    advisories.push({
      recommendation: `${context.consecutiveLosses} consecutive losses detected. Take a break and review strategy before resuming.`,
      category: 'STRATEGY',
      priority: 'HIGH',
      actionable: true,
      confidence: 80,
      impact: 'Protects capital during drawdown'
    })
  }

  // Profit Factor
  if (context.profitFactor < 1.5 && context.profitFactor > 0) {
    advisories.push({
      recommendation: 'Profit factor below 1.5. Work on improving position sizing and trade selection.',
      category: 'STRATEGY',
      priority: 'MEDIUM',
      actionable: true,
      confidence: 82,
      impact: 'Can improve efficiency'
    })
  } else if (context.profitFactor > 3) {
    advisories.push({
      recommendation: 'Outstanding profit factor! Continue your current approach but avoid overconfidence.',
      category: 'STRATEGY',
      priority: 'LOW',
      actionable: false,
      confidence: 88,
      impact: 'Excellent trading edge'
    })
  }

  // Sharpe Ratio Assessment
  if (context.sharpeRatio < 0.5) {
    advisories.push({
      recommendation: 'Sharpe ratio below 0.5 indicates high volatility in returns. Seek more consistent entry signals.',
      category: 'ENTRY',
      priority: 'MEDIUM',
      actionable: true,
      confidence: 85,
      impact: 'Improves return stability'
    })
  } else if (context.sharpeRatio > 2) {
    advisories.push({
      recommendation: 'Exceptional Sharpe ratio! Your strategy provides consistent risk-adjusted returns.',
      category: 'STRATEGY',
      priority: 'LOW',
      actionable: false,
      confidence: 90,
      impact: 'World-class risk management'
    })
  }

  // Time-based Guidance
  if (context.newsRisk === 'HIGH') {
    advisories.push({
      recommendation: 'High-impact news events scheduled. Reduce position sizes or avoid new entries.',
      category: 'RISK',
      priority: 'HIGH',
      actionable: true,
      confidence: 95,
      impact: 'Protects from unexpected volatility'
    })
  }

  // Volatility-based Guidance
  if (context.volatility > 1.5) {
    advisories.push({
      recommendation: 'Market volatility elevated. Use tighter stops and smaller position sizes until it normalizes.',
      category: 'RISK',
      priority: 'MEDIUM',
      actionable: true,
      confidence: 88,
      impact: 'Adapts to market conditions'
    })
  } else if (context.volatility < 0.7) {
    advisories.push({
      recommendation: 'Low volatility environment. Consider wider stops; moves may be delayed or compressed.',
      category: 'ENTRY',
      priority: 'LOW',
      actionable: true,
      confidence: 80,
      impact: 'Optimizes stops for conditions'
    })
  }

  // Time of Day
  if (context.timeOfDay === 'ASIA_SESSION' && context.avgTimeframe === '15min') {
    advisories.push({
      recommendation: 'Trading 15min timeframe during Asia session shows lower win rate historically. Prefer 1H+ timeframes.',
      category: 'STRATEGY',
      priority: 'LOW',
      actionable: true,
      confidence: 75,
      impact: 'Time-based trade filtering'
    })
  }

  return advisories.sort((a, b) => {
    const priorityMap = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 }
    return priorityMap[a.priority] - priorityMap[b.priority]
  })
}

/**
 * Position scaling recommendation based on equity and performance
 */
export function recommendPositionScaling(
  accountBalance: number,
  equityCurve: number[],
  winRate: number,
  expectancy: number
): {
  recommendation: 'SCALE_UP' | 'MAINTAIN' | 'SCALE_DOWN'
  targetRiskPercent: number
  currentRiskPercent: number
  reason: string
  confidence: number
} {
  const recentGrowth = equityCurve.length > 1 
    ? (equityCurve[equityCurve.length - 1] - equityCurve[Math.max(0, equityCurve.length - 21)]) / 
      equityCurve[Math.max(0, equityCurve.length - 21)]
    : 0

  let recommendation: 'SCALE_UP' | 'MAINTAIN' | 'SCALE_DOWN' = 'MAINTAIN'
  let targetRiskPercent = 1.0
  let confidence = 65

  if (winRate >= 0.65 && expectancy > 100 && recentGrowth > 0.05) {
    recommendation = 'SCALE_UP'
    targetRiskPercent = 1.5
    confidence = 85
  } else if (winRate <= 0.50 && expectancy < 0) {
    recommendation = 'SCALE_DOWN'
    targetRiskPercent = 0.5
    confidence = 90
  } else if (recentGrowth > 0.10) {
    recommendation = 'SCALE_UP'
    targetRiskPercent = 1.25
    confidence = 75
  }

  return {
    recommendation,
    targetRiskPercent,
    currentRiskPercent: 1.0,
    reason:
      recommendation === 'SCALE_UP'
        ? `Strong performance (${(recentGrowth * 100).toFixed(1)}% growth). Increase risk to capitalize on edge.`
        : recommendation === 'SCALE_DOWN'
        ? `Weak performance detected. Reduce risk to 0.5% until strategy improves.`
        : `Trading at optimal risk level. Maintain current position sizing.`,
    confidence
  }
}

/**
 * Session-based trading recommendations
 */
export function getSessionTradingGuidance(
  session: 'ASIA' | 'LONDON' | 'NY' | 'SYDNEY',
  volatility: number,
  expectedVolume: 'LOW' | 'MEDIUM' | 'HIGH'
): {
  optimalTimeframe: string[]
  recommendedLotSize: number
  expectedSpread: string
  tradingActivity: 'LOW' | 'MEDIUM' | 'HIGH'
} {
  const guidance: Record<string, any> = {
    ASIA: {
      optimalTimeframe: ['4h', '1day'],
      recommendedLotSize: 0.5,
      expectedSpread: '1.5-2.5 pips',
      tradingActivity: 'LOW'
    },
    LONDON: {
      optimalTimeframe: ['1h', '4h'],
      recommendedLotSize: 1.0,
      expectedSpread: '0.5-1.5 pips',
      tradingActivity: 'HIGH'
    },
    NY: {
      optimalTimeframe: ['15min', '1h'],
      recommendedLotSize: 1.0,
      expectedSpread: '0.4-1.2 pips',
      tradingActivity: 'HIGH'
    },
    SYDNEY: {
      optimalTimeframe: ['4h', '1day'],
      recommendedLotSize: 0.5,
      expectedSpread: '1.5-3.0 pips',
      tradingActivity: 'LOW'
    }
  }

  const base = guidance[session]
  
  // Adjust for volatility
  if (volatility > 1.5) {
    base.recommendedLotSize *= 0.7
  } else if (volatility < 0.7) {
    base.recommendedLotSize *= 1.2
  }

  return base
}

/**
 * Risk-adjusted position sizing recommendation
 */
export function recommendRiskAdjustedPosition(
  accountBalance: number,
  consecutiveLosses: number,
  maxConsecutiveLosses: number,
  currentDrawdown: number,
  maxDrawdown: number
): {
  riskPercent: number
  reason: string
  severity: 'NORMAL' | 'CAUTION' | 'CRITICAL'
} {
  let riskPercent = 1.0
  let reason = 'Normal market conditions'
  let severity: 'NORMAL' | 'CAUTION' | 'CRITICAL' = 'NORMAL'

  // Consecutive loss adjustment
  if (consecutiveLosses >= maxConsecutiveLosses * 0.8 && consecutiveLosses >= 2) {
    riskPercent *= 0.5
    severity = 'CAUTION'
    reason = `${consecutiveLosses} consecutive losses. Reducing risk to preserve capital.`
  }

  // Drawdown adjustment
  if (currentDrawdown > maxDrawdown * 0.75) {
    riskPercent *= 0.5
    severity = 'CRITICAL'
    reason = 'Drawdown approaching maximum. Reducing risk significantly.'
  } else if (currentDrawdown > maxDrawdown * 0.5) {
    riskPercent *= 0.75
    severity = 'CAUTION'
    reason = 'Drawdown elevated. Proceeding with caution.'
  }

  riskPercent = Math.max(riskPercent, 0.25)  // Minimum 0.25%
  
  return { riskPercent, reason, severity }
}
