import type { NextApiRequest, NextApiResponse } from 'next'

const MCP_BASE = 'https://mcp.alphavantage.co/mcp'

type ProxyResponse =
  | { ok: true; data: unknown }
  | { ok: false; error: string; details?: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProxyResponse>
) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, data: { status: 'ready', endpoint: '/api/alphavantage-mcp' } })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const apiKey = process.env.ALPHAVANTAGE_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: 'Missing ALPHAVANTAGE_API_KEY',
      details: 'Set ALPHAVANTAGE_API_KEY in .env.local or deployment environment.'
    })
  }

  const url = `${MCP_BASE}?apikey=${encodeURIComponent(apiKey)}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25_000)

    let upstream: Response
    try {
      upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body ?? {}),
        cache: 'no-store',
        signal: controller.signal
      })
    } finally {
      clearTimeout(timeout)
    }

    const text = await upstream.text()
    let parsed: unknown = text
    try {
      parsed = text ? JSON.parse(text) : {}
    } catch {
      parsed = text
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ok: false,
        error: 'Alpha Vantage MCP request failed',
        details: typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
      })
    }

    return res.status(200).json({ ok: true, data: parsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ ok: false, error: 'MCP proxy error', details: message })
  }
}
