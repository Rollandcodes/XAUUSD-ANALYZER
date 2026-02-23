// lib/performance.ts - Trade Performance Tracking & Analytics

export interface Trade {
  id: string
  timestamp: number
  symbol: string
  direction: 'BUY' | 'SELL'
  entry: number
  exit: number
  stopLoss: number
  takeProfit: number
  lotSize: number
  status: 'OPEN' | 'CLOSED' | 'SL_HIT' | 'CANCELLED'
  pnl: number
  pnlPercent: number
  duration: number
  signalConfidence: number
  signalTier: 'PREMIUM' | 'STANDARD' | 'FILTERED'
  reason?: string
}

export interface PerformanceMetrics {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  largestWin: number
  largestLoss: number
  expectancy: number
  sharpeRatio: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  maxDrawdown: number
  recoveryfactor: number
  totalPnl: number
  monthlyReturn: number
}

export interface TierPerformance {
  premium: {
    trades: number
    wins: number
    winRate: number
    avgRr: number
  }
  standard: {
    trades: number
    wins: number
    winRate: number
    avgRr: number
  }
  filtered: {
    trades: number
    wins: number
    winRate: number
    avgRr: number
  }
}

/**
 * Calculate comprehensive performance metrics
 */
export function calculatePerformanceMetrics(trades: Trade[]): PerformanceMetrics {
  if (trades.length === 0) {
    return getEmptyMetrics()
  }

  const closedTrades = trades.filter(t => t.status === 'CLOSED' || t.status === 'SL_HIT')
  if (closedTrades.length === 0) {
    return getEmptyMetrics()
  }

  const wins = closedTrades.filter(t => t.pnl > 0)
  const losses = closedTrades.filter(t => t.pnl < 0)

  const winValues = wins.map(t => t.pnl)
  const lossValues = losses.map(t => Math.abs(t.pnl))

  const totalWins = winValues.reduce((a, b) => a + b, 0)
  const totalLosses = lossValues.reduce((a, b) => a + b, 0)
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0

  const avgWin = wins.length > 0 ? totalWins / wins.length : 0
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0

  const expectancy = (winValues.length / closedTrades.length) * avgWin - 
                     (lossValues.length / closedTrades.length) * avgLoss

  // Sharpe Ratio (simplified - using daily returns)
  const dailyReturns = calculateDailyReturns(closedTrades)
  const avgReturn = dailyReturns.length > 0 ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length : 0
  const stdDev = calculateStdDev(dailyReturns)
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0  // Annualized

  // Consecutive wins/losses
  const { maxWins, maxLosses } = findConsecutiveExtremes(closedTrades)

  // Max Drawdown
  const maxDD = calculateMaxDrawdown(closedTrades)

  // Recovery Factor
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0)
  const recoveryfactor = maxDD.maxDrawdown > 0 ? Math.abs(totalPnl) / maxDD.maxDrawdown : 0

  // Monthly return (estimate - based on trade frequency and PnL)
  const monthlyReturn = estimateMonthlyReturn(closedTrades, totalPnl)

  return {
    totalTrades: closedTrades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate: (wins.length / closedTrades.length) * 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    largestWin: Math.max(...winValues, 0),
    largestLoss: Math.min(...lossValues.map(v => -v), 0),
    expectancy: Math.round(expectancy * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLosses,
    maxDrawdown: Math.round(maxDD.maxDrawdown * 100) / 100,
    recoveryfactor: Math.round(recoveryfactor * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    monthlyReturn: Math.round(monthlyReturn * 100) / 100
  }
}

/**
 * Performance by signal tier
 */
export function calculateTierPerformance(trades: Trade[]): TierPerformance {
  const closedTrades = trades.filter(t => t.status === 'CLOSED' || t.status === 'SL_HIT')

  const calculateTierStats = (tier: 'PREMIUM' | 'STANDARD' | 'FILTERED') => {
    const tierTrades = closedTrades.filter(t => t.signalTier === tier)
    const wins = tierTrades.filter(t => t.pnl > 0)
    
    const rrs = tierTrades.map(t => {
      const risk = Math.abs(t.entry - t.stopLoss)
      const reward = Math.abs(t.takeProfit - t.entry)
      return risk > 0 ? reward / risk : 0
    })
    
    return {
      trades: tierTrades.length,
      wins: wins.length,
      winRate: tierTrades.length > 0 ? (wins.length / tierTrades.length) * 100 : 0,
      avgRr: rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0
    }
  }

  return {
    premium: calculateTierStats('PREMIUM'),
    standard: calculateTierStats('STANDARD'),
    filtered: calculateTierStats('FILTERED')
  }
}

/**
 * Win streak analysis
 */
export function analyzeWinStreaks(trades: Trade[]): {
  currentStreak: number
  isWinning: boolean
  longestWinStreak: number
  longestLossStreak: number
} {
  const closedTrades = trades.filter(t => t.status === 'CLOSED' || t.status === 'SL_HIT')
  if (closedTrades.length === 0) {
    return { currentStreak: 0, isWinning: false, longestWinStreak: 0, longestLossStreak: 0 }
  }

  let currentStreak = 0
  let isWinning = false
  let longestWinStreak = 0
  let longestLossStreak = 0
  let tempStreak = 0
  let tempIsWinning = closedTrades[0].pnl > 0

  for (const trade of closedTrades) {
    const isWin = trade.pnl > 0
    
    if (isWin === tempIsWinning) {
      tempStreak++
    } else {
      if (tempIsWinning) {
        longestWinStreak = Math.max(longestWinStreak, tempStreak)
      } else {
        longestLossStreak = Math.max(longestLossStreak, tempStreak)
      }
      tempStreak = 1
      tempIsWinning = isWin
    }
  }

  // Last streak
  if (tempIsWinning) {
    longestWinStreak = Math.max(longestWinStreak, tempStreak)
    currentStreak = tempStreak
    isWinning = true
  } else {
    longestLossStreak = Math.max(longestLossStreak, tempStreak)
    currentStreak = tempStreak
    isWinning = false
  }

  return {
    currentStreak,
    isWinning,
    longestWinStreak,
    longestLossStreak
  }
}

// Helper functions

function getEmptyMetrics(): PerformanceMetrics {
  return {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    profitFactor: 0,
    avgWin: 0,
    avgLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    expectancy: 0,
    sharpeRatio: 0,
    maxConsecutiveWins: 0,
    maxConsecutiveLosses: 0,
    maxDrawdown: 0,
    recoveryfactor: 0,
    totalPnl: 0,
    monthlyReturn: 0
  }
}

function calculateDailyReturns(trades: Trade[]): number[] {
  const dailyPnl: Record<string, number> = {}
  
  for (const trade of trades) {
    const date = new Date(trade.timestamp).toISOString().split('T')[0]
    dailyPnl[date] = (dailyPnl[date] || 0) + trade.pnl
  }
  
  return Object.values(dailyPnl)
}

function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function findConsecutiveExtremes(trades: Trade[]): { maxWins: number; maxLosses: number } {
  let maxWins = 0
  let maxLosses = 0
  let currentWins = 0
  let currentLosses = 0

  for (const trade of trades) {
    if (trade.pnl > 0) {
      currentWins++
      currentLosses = 0
      maxWins = Math.max(maxWins, currentWins)
    } else {
      currentLosses++
      currentWins = 0
      maxLosses = Math.max(maxLosses, currentLosses)
    }
  }

  return { maxWins, maxLosses }
}

function calculateMaxDrawdown(trades: Trade[]): { maxDrawdown: number; peak: number } {
  let peak = 0
  let maxDrawdown = 0
  let runningPnl = 0

  for (const trade of trades) {
    runningPnl += trade.pnl
    peak = Math.max(peak, runningPnl)
    const drawdown = peak - runningPnl
    maxDrawdown = Math.max(maxDrawdown, drawdown)
  }

  return { maxDrawdown, peak }
}

function estimateMonthlyReturn(trades: Trade[], totalPnl: number): number {
  if (trades.length === 0) return 0
  
  const oldestTrade = Math.min(...trades.map(t => t.timestamp))
  const newestTrade = Math.max(...trades.map(t => t.timestamp))
  const days = (newestTrade - oldestTrade) / (1000 * 60 * 60 * 24)
  const months = days / 30
  
  if (months < 1) return totalPnl
  return totalPnl / months
}
