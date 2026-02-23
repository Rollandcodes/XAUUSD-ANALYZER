// lib/openai.ts — OpenAI narrative generation
const API_KEY = () => process.env.OPENAI_API_KEY!

export async function generateGoldNarrative(context: any): Promise<string> {
  if (!API_KEY()) {
    return generateFallbackNarrative(context)
  }
  
  try {
    const prompt = buildPrompt(context)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      })
    })
    
    if (!res.ok) throw new Error('OpenAI API error')
    
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? generateFallbackNarrative(context)
  } catch (err) {
    console.warn('[openai] generation failed:', err)
    return generateFallbackNarrative(context)
  }
}

function buildPrompt(ctx: any): string {
  return `You are an expert gold (XAUUSD) trader using ICT concepts. Analyze this data and provide a 2-3 sentence trading narrative:

Price: ${ctx.price}
Signal: ${ctx.signal?.action} @ ${ctx.signal?.confidence}% confidence
AMD Phase: ${ctx.amd?.phase} (${ctx.amd?.bias})
RSI: ${ctx.rsi}
MACD Histogram: ${ctx.macd?.histogram}

Be direct, professional, and mention key confluences.`
}

function generateFallbackNarrative(ctx: any): string {
  const { signal, amd, rsi } = ctx
  
  if (!signal) return 'Market analysis in progress...'
  
  if (signal.action === 'WAIT') {
    return `XAUUSD is in ${amd.phase} phase with ${amd.bias.toLowerCase()} bias. RSI at ${rsi.toFixed(1)} suggests neutral conditions. Awaiting clearer directional confirmation before entry.`
  }
  
  const action = signal.action === 'BUY' ? 'long' : 'short'
  const bias = signal.action === 'BUY' ? 'bullish' : 'bearish'
  
  return `${signal.confidence}% confidence ${action} setup detected. AMD phase shows ${bias} structure with RSI at ${rsi.toFixed(1)}. Entry ${signal.entry.toFixed(2)} targeting TP1 ${signal.tp1.toFixed(2)} (${signal.rr1.toFixed(1)}R). ${signal.confluences[0] ?? 'Multiple confluences align'}.`
}
