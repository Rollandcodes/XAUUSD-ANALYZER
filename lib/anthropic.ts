const API_KEY = () => process.env.ANTHROPIC_API_KEY
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

function fallbackNarrative(context: any): string {
  const signal = context?.signal
  const amd = context?.amd
  const rsi = Number(context?.rsi ?? 50)

  if (!signal) return 'Market analysis in progress...'

  if (signal.action === 'WAIT') {
    return `XAU/USD is in ${amd?.phase ?? 'transition'} with ${(amd?.bias ?? 'NEUTRAL').toLowerCase()} bias. RSI is ${rsi.toFixed(1)} and confluence is limited, so waiting for clearer confirmation is prudent.`
  }

  const direction = signal.action === 'BUY' ? 'bullish' : 'bearish'
  return `${signal.confidence ?? 50}% confidence ${signal.action} setup with ${direction} structure in ${amd?.phase ?? 'current'} phase. Entry ${Number(signal.entry ?? 0).toFixed(2)}, TP1 ${Number(signal.tp1 ?? 0).toFixed(2)}, SL ${Number(signal.stopLoss ?? 0).toFixed(2)}.`
}

async function callAnthropic(prompt: string, maxTokens: number): Promise<string | null> {
  const key = API_KEY()
  if (!key) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        temperature: 0.5,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      console.warn('[anthropic] API error', res.status)
      return null
    }

    const data = await res.json()
    return data?.content?.[0]?.text ?? null
  } catch (error) {
    console.warn('[anthropic] request failed', error)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function buildNarrativePrompt(context: any): string {
  const signal = context?.signal
  return [
    'You are an expert XAU/USD analyst using ICT concepts.',
    'Write a concise 2-3 sentence narrative with confluence and risk awareness.',
    `Price: ${Number(context?.price ?? 0).toFixed(2)}`,
    `Action: ${signal?.action ?? 'WAIT'} | Confidence: ${signal?.confidence ?? 0}%`,
    `AMD: ${context?.amd?.phase ?? 'N/A'} (${context?.amd?.bias ?? 'N/A'})`,
    `RSI: ${Number(context?.rsi ?? 50).toFixed(1)} | MACD hist: ${Number(context?.macd?.histogram ?? 0).toFixed(3)}`,
    `Confluences: ${(signal?.confluences ?? []).slice(0, 4).join(' | ') || 'None'}`,
    'No financial advice disclaimer is not needed in output.',
  ].join('\n')
}

function buildDeepPrompt(context: any): string {
  const signal = context?.signal
  return [
    'Provide a deeper but concise XAU/USD analysis in 4-6 bullets.',
    'Cover market structure, liquidity, scenarios, and risk management.',
    `Price: ${Number(context?.price ?? 0).toFixed(2)}`,
    `Signal: ${signal?.action ?? 'WAIT'} at ${Number(signal?.entry ?? 0).toFixed(2)} | SL ${Number(signal?.stopLoss ?? 0).toFixed(2)} | TP1 ${Number(signal?.tp1 ?? 0).toFixed(2)}`,
    `AMD: ${context?.amd?.phase ?? 'N/A'} / ${context?.amd?.bias ?? 'N/A'}`,
    `RSI: ${Number(context?.rsi ?? 50).toFixed(1)} | ATR: ${Number(context?.atr ?? 0).toFixed(2)}`,
    `OrderBlocks: ${context?.orderBlocks?.length ?? 0} | FVGs: ${context?.fvgs?.length ?? 0} | SR: ${context?.srLevels?.length ?? 0}`,
    `News risk: ${context?.newsRisk?.level ?? 'N/A'} | Bias: ${context?.newsBias?.bias ?? 'N/A'}`,
  ].join('\n')
}

export async function generateGoldNarrative(context: any): Promise<string> {
  const fallback = fallbackNarrative(context)
  const prompt = buildNarrativePrompt(context)
  const response = await callAnthropic(prompt, 300)
  return response ?? fallback
}

export async function generateDeepAnalysis(context: any): Promise<string> {
  const fallback = fallbackNarrative(context)
  const prompt = buildDeepPrompt(context)
  const response = await callAnthropic(prompt, 700)
  return response ?? fallback
}
