// lib/anthropic.ts — Claude AI narrative generation
const API_KEY = () => process.env.ANTHROPIC_API_KEY!

export async function generateGoldNarrative(context: any): Promise<string> {
  if (!API_KEY()) {
    return generateFallbackNarrative(context)
  }

  try {
    const prompt = buildPrompt(context)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY(),
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        temperature: 0.7,
        system: `You are an expert XAU/USD (Gold) trader specializing in ICT (Inner Circle Trader) methodology.
Your role is to provide clear, actionable trading narratives based on technical analysis.

IMPORTANT:
- Be concise and professional
- Focus on key confluences that support the trade setup
- Mention AMD phase, order blocks, FVGs, S&R levels when relevant
- Always mention risk management (RR ratios)
- Never give financial advice - this is educational/analytical content only`,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!res.ok) {
      console.warn('[anthropic] API error:', res.status, await res.text())
      return generateFallbackNarrative(context)
    }

    const data = await res.json()
    return data.content?.[0]?.text ?? generateFallbackNarrative(context)
  } catch (err) {
    console.warn('[anthropic] generation failed:', err)
    return generateFallbackNarrative(context)
  }
}

function buildPrompt(ctx: any): string {
  const { price, signal, amd, rsi, macd, bbands, atr, orderBlocks, fvgs, srLevels, newsRisk, newsBias, spotInsights } = ctx

  return `Analyze this XAU/USD gold trading setup and provide a 2-3 sentence trading narrative:

## Current Market Data
- Price: $${price?.toFixed(2)}
- RSI (14): ${rsi?.toFixed(1)}
- MACD Histogram: ${macd?.histogram?.toFixed(3)}
- ATR: ${atr?.)}
- Bollinger Bands: UppertoFixed(2 $${bbands?.upper?.toFixed(2)} | Middle $${bbands?.middle?.toFixed(2)} | Lower $${bbands?.lower?.toFixed(2)}

## Signal
- Action: ${signal?.action}
- Confidence: ${signal?.confidence}%
- Entry: $${signal?.entry?.toFixed(2)}
- Stop Loss: $${signal?.stopLoss?.toFixed(2)}
- TP1: $${signal?.tp1?.toFixed(2)} (${signal?.rr1?.toFixed(1)}R)
- TP2: $${signal?.tp2?.toFixed(2)} (${signal?.rr2?.toFixed(1)}R)

## AMD Analysis
- Phase: ${amd?.phase}
- Bias: ${amd?.bias}
- Session High: $${amd?.sessionHigh?.toFixed(2)}
- Session Low: $${amd?.sessionLow?.toFixed(2)}

## ICT Elements
- Order Blocks: ${orderBlocks?.length || 0} detected
- FVGs: ${fvgs?.length || 0} detected
- S&R Levels: ${srLevels?.length || 0} detected
${srLevels?.length ? `- Major ${srLevels[0]?.type}: $${srLevels[0]?.price?.toFixed(2)}` : ''}

## Fundamental
- News Risk: ${newsRisk?.level}
- Gold Bias: ${newsBias?.bias}
${spotInsights?.spread ? `- Bid/Ask Spread: ${spotInsights.spread.toFixed(2)}` : ''}

## Key Confluences
${signal?.confluences?.join('\n- ') || 'None'}

Provide a brief, professional trading narrative highlighting the most important confluences.`
}

function generateFallbackNarrative(ctx: any): string {
  const { price, signal, amd, rsi, macd, bbands, atr, newsRisk, newsBias, spotInsights } = ctx

  if (!signal) return 'Market analysis in progress...'

  if (signal.action === 'WAIT') {
    const reasons = []
    if (newsRisk?.avoid) reasons.push('high-impact news')
    if (rsi > 70 || rsi < 30) reasons.push('RSI at extreme')
    if (!reasons.length) reasons.push('no clear confluence')

    return `XAU/USD consolidating. AMD shows ${amd?.phase || 'uncertainty'} phase with ${(amd?.bias || 'NEUTRAL').toLowerCase()} bias. ` +
      `RSI at ${rsi?.toFixed(1)} — waiting for ${reasons.join(' & ')} to resolve.`
  }

  const action = signal.action === 'BUY' ? 'long' : 'short'
  const direction = signal.action === 'BUY' ? 'upside' : 'downside'
  const bias = signal.action === 'BUY' ? 'bullish' : 'bearish'

  let narrative = `${signal.confidence}% confidence ${action} setup. `

  // Add AMD context
  narrative += `AMD in ${(amd?.phase || 'neutral').toLowerCase()} with ${bias} bias. `

  // Add RSI context
  if (rsi < 40) narrative += `RSI oversold (${rsi.toFixed(1)}),`
  else if (rsi > 60) narrative += `RSI overbought (${rsi.toFixed(1)}),`
  else narrative += `RSI neutral (${rsi.toFixed(1)}),`

  // Add MACD context
  if (macd?.histogram > 0) narrative += ' MACD bullish.'
  else if (macd?.histogram < 0) narrative += ' MACD bearish.'
  else narrative += ' MACD neutral.'

  // Add risk/reward
  narrative += ` Entry at $${signal.entry?.toFixed(2)} targeting $${signal.tp1?.toFixed(2)} for ${signal.rr1?.toFixed(1)}R.`

  // Add key confluence
  if (signal.confluences?.[0]) {
    narrative += ` ${signal.confluences[0]}.`
  }

  return narrative
}

// Extended analysis function using Claude with thinking for complex market analysis
export async function generateDeepAnalysis(context: any): Promise<string> {
  if (!API_KEY()) {
    return generateFallbackNarrative(context)
  }

  try {
    const prompt = buildDeepAnalysisPrompt(context)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY(),
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        temperature: 0.5,
        system: `You are a senior XAU/USD gold trader with expertise in ICT methodology, SMC (Smart Money Concepts), and multi-timeframe analysis.

Provide deep, analytical trading insights that:
1. Identify market structure (accumulation, distribution, manipulation, decline)
2. Note liquidity pools and potential stop hunts
3. Analyze order flow and order block interactions
4. Consider macroeconomic factors affecting gold
5. Evaluate risk/reward scenarios

Be analytical, not promotional. Always consider both Bull and Bear cases.`,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!res.ok) {
      console.warn('[anthropic] deep analysis API error:', res.status)
      return generateFallbackNarrative(context)
    }

    const data = await res.json()
    return data.content?.[0]?.text ?? generateFallbackNarrative(context)
  } catch (err) {
    console.warn('[anthropic] deep analysis failed:', err)
    return generateFallbackNarrative(context)
  }
}

function buildDeepAnalysisPrompt(ctx: any): string {
  const { price, signal, amd, rsi, macd, bbands, atr, orderBlocks, fvgs, srLevels, newsRisk, newsBias, spotInsights, mta, patterns } = ctx

  return `# Deep XAU/USD Market Analysis

## Price Action
Current Price: $${price?.toFixed(2)}
ATR (14): ${atr?.toFixed(2)} — Current volatility context

## Technical Indicators
- RSI (14): ${rsi?.toFixed(1)}
- MACD: Line ${macd?.macd?.toFixed(3)} | Signal ${macd?.signal?.toFixed(3)} | Hist ${macd?.histogram?.toFixed(3)}
- Bollinger Bands: ${bbands?.lower?.toFixed(2)} | ${bbands?.middle?.toFixed(2)} | ${bbands?.upper?.toFixed(2)}

## Market Structure (AMD)
- Phase: ${amd?.phase || 'Unknown'}
- Bias: ${amd?.bias || 'NEUTRAL'}
- Session Range: $${amd?.sessionLow?.toFixed(2)} - $${amd?.sessionHigh?.toFixed(2)}

## Order Blocks (Last 5)
${orderBlocks?.slice(-5).map((ob: any) =>
  `- ${ob.type} OB: $${ob.bottom?.toFixed(2)} - $${ob.top?.toFixed(2)} (${ob.strength})`
).join('\n') || 'None detected'}

## Fair Value Gaps (Last 3)
${fvgs?.slice(-3).map((fvg: any) =>
  `- ${fvg.type} FVG: $${fvg.bottom?.toFixed(2)} - $${fvg.top?.toFixed(2)} (${fvg.size?.toFixed(2)})`
).join('\n') || 'None detected'}

## Support & Resistance
${srLevels?.map((sr: any) => `- ${sr.type}: $${sr.price?.toFixed(2)} (${sr.touches} touches)`).join('\n') || 'None identified'}

## Current Signal
- Action: ${signal?.action}
- Entry: $${signal?.entry?.toFixed(2)}
- SL: $${signal?.stopLoss?.toFixed(2)}
- TP1: $${signal?.tp1?.toFixed(2)} (${signal?.rr1?.toFixed(1)}R)
- TP2: $${signal?.tp2?.toFixed(2)} (${signal?.rr2?.toFixed(1)}R)
- Confidence: ${signal?.confidence}%

## News & Fundamentals
- Risk Level: ${newsRisk?.level || 'UNKNOWN'}
- Gold Bias: ${newsBias?.bias || 'NEUTRAL'}
- Summary: ${newsBias?.summary || 'No clear fundamental bias'}

${spotInsights ? `## Spot Market
- Bid: $${spotInsights.bid?.toFixed(2)}
- Ask: $${spotInsights.ask?.toFixed(2)}
- Spread: ${spotInsights.spread?.toFixed(2)}
- Weekly Range Position: ${spotInsights.weeklyRange?.positionPct?.toFixed(0)}%` : ''}

${mta ? `## Multi-Timeframe Analysis
${Object.entries(mta).map(([tf, data]: [string, any]) =>
  `- ${tf}: ${data.trend} | RSI ${data.rsi?.toFixed(1)} | Signal ${data.signal}`
).join('\n')}` : ''}

${patterns ? `## Pattern Detection
${Object.entries(patterns).map(([pattern, detected]: [string, any]) =>
  `- ${pattern}: ${detected ? 'DETECTED' : 'Not detected'}`
).join('\n')}` : ''}

Provide a comprehensive market analysis covering:
1. Current market structure and likely phase
2. Liquidity analysis (where might stop hunts occur?)
3. Order block and FVG confluence zones
4. Bull and bear case scenarios
5. Risk assessment and optimal entry zones`
}
