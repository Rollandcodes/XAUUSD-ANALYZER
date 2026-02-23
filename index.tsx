import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Candle { time:number; open:number; high:number; low:number; close:number; volume:number }
interface OrderBlock { id:string; type:'BULLISH'|'BEARISH'; top:number; bottom:number; bodyTop:number; bodyBottom:number; time:number; strength:'STRONG'|'MODERATE'|'WEAK' }
interface FVG { id:string; type:'BULLISH'|'BEARISH'; top:number; bottom:number; size:number; midpoint:number }
interface SRLevel { price:number; type:string; touches:number; strength:number }
interface AMDPhase { phase:string; description:string; bias:'BULLISH'|'BEARISH'|'NEUTRAL'; sessionHigh:number; sessionLow:number; asiaHigh?:number; asiaLow?:number; manipulation:string }
interface GoldSignal { action:'BUY'|'SELL'|'WAIT'; confidence:number; entry:number; entryZone:[number,number]; stopLoss:number; tp1:number; tp2:number; tp3:number; rr1:number; rr2:number; rr3:number; pips:{sl:number;tp1:number;tp2:number;tp3:number}; confluences:string[]; invalidation:string; sessionBias:string }
interface NewsEvent { Name:string; Currency:string; Category:string; Impact:'High'|'Medium'|'Low'|'None'; Date:string; Actual:number|null; Forecast:number|null; Previous:number|null; Outcome:string; Strength:string; Quality:string }
interface NewsRisk { level:'RED'|'ORANGE'|'YELLOW'|'GREEN'; label:string; reason:string; avoid:boolean; events:NewsEvent[] }
interface NewsBias { bias:'BULLISH_GOLD'|'BEARISH_GOLD'|'NEUTRAL'; score:number; summary:string }

interface GoldSpot { timestamp:number; metal:string; currency:string; ask:number; bid:number; price:number; ch:number; chp:number; prev_close_price:number; price_gram_24k:number; price_gram_22k:number; price_gram_21k:number; price_gram_18k:number; spread:number; spreadPct:number }
interface SpotInsights { spreadQuality:'TIGHT'|'NORMAL'|'WIDE'; spreadNote:string; entryNote:string; weeklyRange?:{high:number;low:number;midpoint:number;positionPct:number}; weeklyTrend?:string; gramPrices:{oz_24k:number;oz_22k:number;oz_21k:number;oz_18k:number;g_24k:number;g_22k:number;g_21k:number;g_18k:number} }

interface AnalysisData {
  quote: { symbol:string; close:number; change:number; percent_change:number; high:number; low:number; open:number; volume:number; fifty_two_week:{low:number;high:number} }
  candles: Candle[]
  rsi: number; macd:{macd:number;signal:number;histogram:number}; bbands:{upper:number;middle:number;lower:number}; atr:number
  amd: AMDPhase; orderBlocks:OrderBlock[]; fvgs:FVG[]; srLevels:SRLevel[]
  signal: GoldSignal; narrative: string; timestamp: string
  news: { today: NewsEvent[]; upcoming: NewsEvent[]; risk: NewsRisk; bias: NewsBias }
  spot: (GoldSpot & { insights: SpotInsights; history: any[] }) | null
}

const INTERVALS = [
  { label:'M15', value:'15min' }, { label:'H1', value:'1h' },
  { label:'H4', value:'4h'    }, { label:'D1', value:'1day' },
]

const f = (n:number, d=2) => (n??0).toFixed(d)
const fSign = (n:number, d=2) => `${n>=0?'+':''}${n.toFixed(d)}`

// ── Phase Colors ──────────────────────────────────────────────────────────────
const phaseColor = (p:string) =>
  p==='ACCUMULATION'?'var(--amber)':p==='MANIPULATION'?'var(--red)':p==='DISTRIBUTION'?'var(--green)':'var(--text2)'

const phaseIcon = (p:string) =>
  p==='ACCUMULATION'?'◈':p==='MANIPULATION'?'⚡':p==='DISTRIBUTION'?'◆':'○'

export default function GoldTerminal() {
  const [interval, setInterval_] = useState('1h')
  const [data,     setData]      = useState<AnalysisData|null>(null)
  const [loading,  setLoading]   = useState(false)
  const [error,    setError]     = useState('')
  const [autoRef,  setAutoRef]   = useState(false)
  const [lastUp,   setLastUp]    = useState<Date|null>(null)
  const chartRef    = useRef<HTMLDivElement>(null)
  const chartInst   = useRef<any>(null)
  const seriesRef   = useRef<any>(null)
  const timerRef    = useRef<any>()

  const analyze = useCallback(async (int = interval) => {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ interval: int }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json)
      setLastUp(new Date())
    } catch(e:any) { setError(e.message??'Analysis failed') }
    finally        { setLoading(false) }
  }, [interval])

  // ── Chart ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!data?.candles?.length || !chartRef.current) return
    const init = async () => {
      const { createChart, ColorType, CrosshairMode, LineStyle } = await import('lightweight-charts')
      const el = chartRef.current!

      if (!chartInst.current) {
        chartInst.current = createChart(el, {
          layout: { background:{type:ColorType.Solid,color:'#0a0b0e'}, textColor:'#9a9280', fontFamily:"'JetBrains Mono',monospace" },
          grid:   { vertLines:{color:'rgba(184,152,90,0.06)'}, horzLines:{color:'rgba(184,152,90,0.06)'} },
          crosshair: { mode:CrosshairMode.Normal, vertLine:{color:'rgba(201,168,76,0.4)',style:LineStyle.Dashed}, horzLine:{color:'rgba(201,168,76,0.4)',style:LineStyle.Dashed} },
          rightPriceScale:{ borderColor:'rgba(184,152,90,0.15)' },
          timeScale:{ borderColor:'rgba(184,152,90,0.15)', timeVisible:true, secondsVisible:false },
          width: el.clientWidth, height: 380,
        })
        seriesRef.current = chartInst.current.addCandlestickSeries({
          upColor:'#3ddc97', downColor:'#e05c6a',
          borderVisible:false, wickUpColor:'#3ddc97', wickDownColor:'#e05c6a',
        })
      }

      seriesRef.current.setData(data.candles.map(c => ({ time:c.time as any, open:c.open, high:c.high, low:c.low, close:c.close })))

      // Remove old price lines and redraw
      try { chartInst.current.removeAllPriceLines?.() } catch {}

      const sig = data.signal
      if (sig.action !== 'WAIT') {
        const pls = [
          { price:sig.entry,   color:'#c9a84c', title:'◈ ENTRY',  lineWidth:2, lineStyle:0 },
          { price:sig.stopLoss,color:'#e05c6a', title:'✕ STOP',   lineWidth:1, lineStyle:2 },
          { price:sig.tp1,     color:'#3ddc97', title:'▷ TP1',    lineWidth:1, lineStyle:2 },
          { price:sig.tp2,     color:'#3ddc97', title:'▷ TP2',    lineWidth:1, lineStyle:2 },
          { price:sig.tp3,     color:'#3ddc97', title:'▷ TP3',    lineWidth:1, lineStyle:2 },
        ]
        pls.forEach(pl => seriesRef.current.createPriceLine(pl))

        // FVG zones as background areas (using band series)
        data.fvgs.slice(0,3).forEach(fvg => {
          seriesRef.current.createPriceLine({ price:fvg.top,    color:'rgba(201,168,76,0.25)', title:'', lineWidth:1, lineStyle:LineStyle.Dotted })
          seriesRef.current.createPriceLine({ price:fvg.bottom, color:'rgba(201,168,76,0.25)', title:'FVG', lineWidth:1, lineStyle:LineStyle.Dotted })
        })

        // S&R
        data.srLevels.slice(0,5).forEach(sr => {
          const c = sr.type.includes('SUPPORT') ? 'rgba(61,220,151,0.3)' : 'rgba(224,92,106,0.3)'
          seriesRef.current.createPriceLine({ price:sr.price, color:c, title:sr.type.replace('_',' '), lineWidth:1, lineStyle:LineStyle.Dotted })
        })
      }
      chartInst.current.timeScale().fitContent()
    }
    init()
  }, [data])

  useEffect(() => {
    const onResize = () => { if (chartInst.current && chartRef.current) chartInst.current.applyOptions({ width: chartRef.current.clientWidth }) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (autoRef && data) timerRef.current = setInterval(() => analyze(), 60_000)
    return () => clearInterval(timerRef.current)
  }, [autoRef, analyze, data])

  const sig    = data?.signal
  const q      = data?.quote
  const amd    = data?.amd
  const isUp   = (q?.percent_change??0) >= 0
  const aColor = sig?.action==='BUY'?'var(--green)':sig?.action==='SELL'?'var(--red)':'var(--amber)'
  const aBg    = sig?.action==='BUY'?'var(--green2)':sig?.action==='SELL'?'var(--red2)':'var(--amber2)'

  return (
    <>
      <Head>
        <title>XAU/USD · PipNexus Terminal</title>
        <meta name="description" content="PipNexus XAUUSD AI trading terminal — AMD, Order Blocks, FVG, S&R" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⬡</text></svg>" />
        <style>{`
          :root {
            --bg: #06070a; --bg2: #0d0f14; --bg3: #14161c; --bg4: #1a1d24;
            --text: #eae8e0; --text2: #c5c2b8; --text3: #9a9280;
            --border: rgba(184,152,90,0.12); --border2: rgba(184,152,90,0.18); --border3: rgba(184,152,90,0.25);
            --gold: #c9a84c; --gold2: #e8c97a; --gold-glow: rgba(201,168,76,0.15); --gold-dim: rgba(201,168,76,0.08);
            --green: #3ddc97; --green2: rgba(61,220,151,0.1);
            --red: #e05c6a; --red2: rgba(224,92,106,0.1);
            --amber: #f0a500;
            --mono: 'JetBrains Mono', 'Roboto Mono', 'Courier New', monospace;
            --serif: 'Bricolage Grotesque', 'Inter', -apple-system, system-ui, sans-serif;
          }
          * { margin:0; padding:0; box-sizing:border-box; }
          body { background:var(--bg); color:var(--text); font-family:var(--mono); font-size:13px; line-height:1.6; overflow-x:hidden; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }
          @keyframes glow {
            0%, 100% { opacity: 0.4; filter: drop-shadow(0 0 24px rgba(201,168,76,0.3)); }
            50% { opacity: 0.6; filter: drop-shadow(0 0 32px rgba(201,168,76,0.5)); }
          }
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fu { animation: fadeUp 0.4s ease; }
          .fu1 { animation: fadeUp 0.5s ease; }
          .fu2 { animation: fadeUp 0.6s ease; }
          .fu3 { animation: fadeUp 0.7s ease; }
          .fu4 { animation: fadeUp 0.8s ease; }
          .fu5 { animation: fadeUp 0.9s ease; }
          button:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
          button:active:not(:disabled) { transform: translateY(0); }
          button { transition: all 0.2s ease; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: var(--bg2); }
          ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.5); }
        `}</style>
      </Head>

      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', position:'relative', zIndex:1, background:'linear-gradient(135deg, #050609 0%, #0a0b0e 50%, #0d0f14 100%)' }}>

        {/* Ambient background effects */}
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-10%', left:'-10%', width:'40%', height:'40%', background:'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)', filter:'blur(80px)' }} />
          <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50%', height:'50%', background:'radial-gradient(circle, rgba(61,220,151,0.06) 0%, transparent 70%)', filter:'blur(100px)' }} />
          <div style={{ position:'absolute', top:'30%', right:'20%', width:'30%', height:'30%', background:'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)', filter:'blur(90px)' }} />
        </div>

        {/* ── HEADER ── */}
        <header style={s.header}>
          <div style={s.headerInner}>
            <div style={s.logo}>
              <span style={s.logoMark}>⬡</span>
              <div>
                <div style={s.logoTitle}>PIPNEXUS</div>
                <div style={s.logoSub}>XAU/USD · ICT INTELLIGENCE</div>
              </div>
              {q && (
                <div style={s.livePrice}>
                  <span style={s.livePriceNum}>{f(q.close, 2)}</span>
                  <span style={{ ...s.livePriceChg, color: isUp?'var(--green)':'var(--red)' }}>
                    {isUp?'▲':'▼'} {f(Math.abs(q.percent_change),2)}%
                  </span>
                </div>
              )}
            </div>

            <div style={s.controls}>
              <div style={s.ivRow}>
                {INTERVALS.map(iv => (
                  <button key={iv.value} style={{ ...s.ivBtn, ...(interval===iv.value?s.ivBtnActive:{}) }}
                    onClick={() => { setInterval_(iv.value); analyze(iv.value) }}>
                    {iv.label}
                  </button>
                ))}
              </div>
              <button style={{ ...s.analyzeBtn, opacity: loading?0.5:1 }} onClick={() => analyze()} disabled={loading}>
                {loading ? <span style={s.spinner} /> : '⟳ ANALYZE'}
              </button>
              <label style={s.toggleWrap}>
                <div style={{ ...s.toggleBg, background: autoRef?'var(--gold-glow)':'var(--bg3)', borderColor: autoRef?'var(--gold)':'var(--border)' }}>
                  <div style={{ ...s.toggleThumb, transform: autoRef?'translateX(14px)':'translateX(0)', background: autoRef?'var(--gold)':'var(--text3)' }} />
                </div>
                <input type="checkbox" style={{display:'none'}} checked={autoRef} onChange={e => setAutoRef(e.target.checked)} />
                <span style={s.toggleLabel}>AUTO</span>
              </label>
            </div>
          </div>
        </header>

        {/* ── ERROR ── */}
        {error && <div style={s.error}>⚠ {error}</div>}

        {/* ── EMPTY STATE ── */}
        {!data && !loading && !error && (
          <div style={s.empty} className="fu">
            <div style={s.emptyGlyph}>⬡</div>
            <div style={s.emptyTitle}>PipNexus Intelligence</div>
            <div style={s.emptyDesc}>AMD Strategy · Order Blocks · Fair Value Gaps · Support & Resistance</div>
            <button style={s.emptyBtn} onClick={() => analyze()}>
              ⟳ INITIALIZE ANALYSIS
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div style={s.loadWrap}>
            <div style={s.loadBar}><div style={s.loadFill} /></div>
            <div style={s.loadText}>Scanning XAUUSD · Fetching Spot Price · Detecting Order Blocks · Computing AMD Phase…</div>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {data && !loading && (
          <main style={s.main}>

            {/* ── GOLDAPI SPOT STRIP ── */}
            {data.spot && (
              <div style={s.spotStrip} className="fu">

                {/* Bid / Ask / Spread */}
                <div style={s.spotPriceBlock}>
                  <div style={s.spotLabel}>BID</div>
                  <div style={s.spotBid}>{f(data.spot.bid)}</div>
                </div>
                <div style={s.spotDivider} />
                <div style={s.spotPriceBlock}>
                  <div style={s.spotLabel}>ASK</div>
                  <div style={s.spotAsk}>{f(data.spot.ask)}</div>
                </div>
                <div style={s.spotDivider} />
                <div style={s.spotPriceBlock}>
                  <div style={s.spotLabel}>SPREAD</div>
                  <div style={{ ...s.spotSpread, color: data.spot.insights.spreadQuality==='TIGHT'?'var(--green)':data.spot.insights.spreadQuality==='WIDE'?'var(--red)':'var(--amber)' }}>
                    {f(data.spot.spread)} · {data.spot.spreadPct}%
                  </div>
                  <div style={{ ...s.spotLabel, color: data.spot.insights.spreadQuality==='TIGHT'?'var(--green)':data.spot.insights.spreadQuality==='WIDE'?'var(--red)':'var(--amber)' }}>
                    {data.spot.insights.spreadQuality}
                  </div>
                </div>

                <div style={s.spotDivider} />

                {/* Weekly Range bar */}
                {data.spot.insights.weeklyRange && (
                  <div style={s.weeklyRangeBlock}>
                    <div style={s.spotLabel}>
                      WEEKLY RANGE · {data.spot.insights.weeklyTrend}
                      <span style={{ color: data.spot.insights.weeklyTrend==='UPTREND'?'var(--green)':data.spot.insights.weeklyTrend==='DOWNTREND'?'var(--red)':'var(--amber)', marginLeft:6 }}>
                        {data.spot.insights.weeklyTrend==='UPTREND'?'▲':data.spot.insights.weeklyTrend==='DOWNTREND'?'▼':'◆'}
                      </span>
                    </div>
                    <div style={s.weeklyRangeRow}>
                      <span style={s.spotLabel}>{f(data.spot.insights.weeklyRange.low)}</span>
                      <div style={s.weeklyTrack}>
                        <div style={s.weeklyMidLine} />
                        <div style={{ ...s.weeklyThumb, left:`${data.spot.insights.weeklyRange.positionPct}%` }} />
                      </div>
                      <span style={s.spotLabel}>{f(data.spot.insights.weeklyRange.high)}</span>
                    </div>
                    <div style={{ ...s.spotLabel, textAlign:'center' as any, color:'var(--gold)' }}>
                      {data.spot.insights.weeklyRange.positionPct}% of range · mid {f(data.spot.insights.weeklyRange.midpoint)}
                    </div>
                  </div>
                )}

                <div style={s.spotDivider} />

                {/* Gram Prices */}
                <div style={s.gramBlock}>
                  <div style={s.spotLabel}>GRAM PRICES (USD)</div>
                  <div style={s.gramRow}>
                    <div style={s.gramItem}><span style={s.gramLabel}>24K</span><span style={s.gramVal}>{f(data.spot.price_gram_24k, 2)}</span></div>
                    <div style={s.gramItem}><span style={s.gramLabel}>22K</span><span style={s.gramVal}>{f(data.spot.price_gram_22k, 2)}</span></div>
                    <div style={s.gramItem}><span style={s.gramLabel}>21K</span><span style={s.gramVal}>{f(data.spot.price_gram_21k, 2)}</span></div>
                    <div style={s.gramItem}><span style={s.gramLabel}>18K</span><span style={s.gramVal}>{f(data.spot.price_gram_18k, 2)}</span></div>
                  </div>
                </div>

                <div style={s.spotDivider} />

                {/* Prev close + change */}
                <div style={s.spotPriceBlock}>
                  <div style={s.spotLabel}>PREV CLOSE</div>
                  <div style={s.spotMid}>{f(data.spot.prev_close_price)}</div>
                  <div style={{ color: data.spot.ch >= 0 ? 'var(--green)' : 'var(--red)', fontSize:11 }}>
                    {data.spot.ch >= 0 ? '▲' : '▼'} {f(Math.abs(data.spot.ch))} ({f(Math.abs(data.spot.chp), 2)}%)
                  </div>
                </div>

                <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
                  <span style={s.goldapiTag}>◈ GoldAPI.io</span>
                </div>
              </div>
            )}

            {/* ── AMD BANNER ── */}
            <div style={{ ...s.amdBanner, borderColor: phaseColor(amd?.phase??'') }} className="fu">
              <div style={s.amdLeft}>
                <span style={{ ...s.amdPhaseIcon, color: phaseColor(amd?.phase??'') }}>{phaseIcon(amd?.phase??'')}</span>
                <div>
                  <div style={{ ...s.amdPhaseLabel, color: phaseColor(amd?.phase??'') }}>
                    {amd?.phase} PHASE
                  </div>
                  <div style={s.amdDesc}>{amd?.description}</div>
                </div>
              </div>
              <div style={s.amdRight}>
                {amd?.asiaHigh && (
                  <>
                    <div style={s.amdStat}><span>ASIA H</span><b>{f(amd.asiaHigh)}</b></div>
                    <div style={s.amdStat}><span>ASIA L</span><b>{f(amd.asiaLow??0)}</b></div>
                  </>
                )}
                <div style={s.amdStat}><span>SESSION H</span><b>{f(amd?.sessionHigh??0)}</b></div>
                <div style={s.amdStat}><span>SESSION L</span><b>{f(amd?.sessionLow??0)}</b></div>
                <div style={{ ...s.biasBadge, color: amd?.bias==='BULLISH'?'var(--green)':amd?.bias==='BEARISH'?'var(--red)':'var(--amber)', borderColor: amd?.bias==='BULLISH'?'var(--green)':amd?.bias==='BEARISH'?'var(--red)':'var(--amber)' }}>
                  {amd?.bias}
                </div>
              </div>
            </div>

            {/* ── GRID ── */}
            <div style={s.grid}>

              {/* ── CHART ── */}
              <div style={{ ...s.card, ...s.chartCard }} className="fu1">
                <div style={s.cardHead}>
                  <span style={s.cardTitle}>PRICE ACTION · XAU/USD</span>
                  <div style={s.chartLegend}>
                    <span style={{color:'var(--gold)'}}>── ENTRY</span>
                    <span style={{color:'var(--red)'}}>── STOP</span>
                    <span style={{color:'var(--green)'}}>── TP</span>
                    <span style={{color:'rgba(201,168,76,0.4)'}}>⋯ FVG/S&R</span>
                  </div>
                </div>
                <div ref={chartRef} style={{ borderRadius:4, overflow:'hidden', minHeight:380 }} />
              </div>

              {/* ── SIGNAL ── */}
              <div style={{ ...s.card, ...s.signalCard }} className="fu2">
                <div style={s.cardHead}>
                  <span style={s.cardTitle}>TRADE SIGNAL</span>
                  {sig?.action !== 'WAIT' && <span style={s.liveDot} />}
                </div>

                {/* Action */}
                <div style={{ ...s.actionBox, color:aColor, borderColor:aColor, background:aBg }}>
                  <span style={s.actionVerb}>{sig?.action}</span>
                  <span style={s.actionSub}>XAU/USD</span>
                </div>

                {/* Confidence */}
                <div style={s.confRow}>
                  <span style={s.micro}>CONFIDENCE</span>
                  <span style={{ ...s.micro, color: (sig?.confidence??0)>=70?'var(--green)':(sig?.confidence??0)>=50?'var(--amber)':'var(--red)' }}>
                    {sig?.confidence}%
                  </span>
                </div>
                <div style={s.confTrack}>
                  <div style={{ ...s.confFill, width:`${sig?.confidence??0}%`, background:(sig?.confidence??0)>=70?'var(--green)':(sig?.confidence??0)>=50?'var(--amber)':'var(--red)' }} />
                </div>

                {/* Levels */}
                <div style={s.levelsGrid}>
                  <LevelRow label="ENTRY ZONE" value={`${f(sig?.entryZone?.[0]??0)} – ${f(sig?.entryZone?.[1]??0)}`} color="var(--gold)" main />
                  <LevelRow label="ENTRY"      value={f(sig?.entry??0)}    color="var(--gold)" />
                  <LevelRow label="STOP LOSS"  value={f(sig?.stopLoss??0)} color="var(--red)"   diff={`−${f(sig?.pips?.sl??0,1)} pts`} diffColor="var(--red)" />
                  <LevelRow label="TP 1"       value={f(sig?.tp1??0)}      color="var(--green)" diff={`+${f(sig?.pips?.tp1??0,1)}`} rrBadge={`1:${sig?.rr1}`} />
                  <LevelRow label="TP 2"       value={f(sig?.tp2??0)}      color="var(--green)" diff={`+${f(sig?.pips?.tp2??0,1)}`} rrBadge={`1:${sig?.rr2}`} />
                  <LevelRow label="TP 3"       value={f(sig?.tp3??0)}      color="var(--green)" diff={`+${f(sig?.pips?.tp3??0,1)}`} rrBadge={`1:${sig?.rr3}`} />
                </div>

                {sig?.invalidation && (
                  <div style={s.invalidation}>
                    <span style={s.micro}>INVALIDATION</span>
                    <p style={s.invalidText}>{sig.invalidation}</p>
                  </div>
                )}
              </div>

              {/* ── ORDER BLOCKS ── */}
              <div style={{ ...s.card }} className="fu2">
                <div style={s.cardHead}><span style={s.cardTitle}>ORDER BLOCKS</span><span style={s.cardCount}>{data.orderBlocks.length} ACTIVE</span></div>
                {data.orderBlocks.length === 0 && <div style={s.empty2}>No unmitigated order blocks near price</div>}
                {data.orderBlocks.map(ob => (
                  <div key={ob.id} style={{ ...s.obRow, borderLeftColor: ob.type==='BULLISH'?'var(--green)':'var(--red)' }}>
                    <div style={s.obLeft}>
                      <span style={{ ...s.obType, color:ob.type==='BULLISH'?'var(--green)':'var(--red)' }}>{ob.type}</span>
                      <span style={{ ...s.obStrength, color: ob.strength==='STRONG'?'var(--gold)':ob.strength==='MODERATE'?'var(--amber)':'var(--text3)' }}>{ob.strength}</span>
                    </div>
                    <div style={s.obZone}>
                      <span style={s.obPrice}>{f(ob.bodyBottom)} – {f(ob.bodyTop)}</span>
                      <span style={s.micro2}>Body zone</span>
                    </div>
                    <div style={s.obZone}>
                      <span style={s.micro2}>WICK</span>
                      <span style={s.micro2}>{f(ob.bottom)} – {f(ob.top)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── FVG ── */}
              <div style={{ ...s.card }} className="fu3">
                <div style={s.cardHead}><span style={s.cardTitle}>FAIR VALUE GAPS</span><span style={s.cardCount}>{data.fvgs.length} OPEN</span></div>
                {data.fvgs.length === 0 && <div style={s.empty2}>No open imbalances detected</div>}
                {data.fvgs.map(fvg => (
                  <div key={fvg.id} style={{ ...s.fvgRow, borderLeftColor: fvg.type==='BULLISH'?'var(--green)':'var(--red)' }}>
                    <span style={{ ...s.obType, color:fvg.type==='BULLISH'?'var(--green)':'var(--red)' }}>{fvg.type}</span>
                    <div style={s.fvgBody}>
                      <span style={s.obPrice}>{f(fvg.bottom)} – {f(fvg.top)}</span>
                      <span style={s.micro2}>Mid: {f(fvg.midpoint)}</span>
                    </div>
                    <div style={s.fvgSize}>
                      <span style={s.micro2}>SIZE</span>
                      <span style={{ ...s.micro, color:'var(--gold)' }}>{f(fvg.size,1)} pts</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── S&R ── */}
              <div style={{ ...s.card }} className="fu3">
                <div style={s.cardHead}><span style={s.cardTitle}>SUPPORT & RESISTANCE</span></div>
                {data.srLevels.map((sr, i) => (
                  <div key={i} style={s.srRow}>
                    <div style={{ ...s.srDot, background: sr.type.includes('SUPPORT')?'var(--green)':'var(--red)', boxShadow:`0 0 6px ${sr.type.includes('SUPPORT')?'var(--green)':'var(--red)'}` }} />
                    <div style={s.srInfo}>
                      <span style={{ ...s.micro, color: sr.type.includes('STRONG')?'var(--gold)':'var(--text2)' }}>{sr.type.replace('_',' ')}</span>
                      <span style={s.srPrice}>{f(sr.price)}</span>
                    </div>
                    <div style={s.srTouches}>
                      <span style={s.micro2}>{sr.touches}x TOUCHES</span>
                      <div style={s.srBar}><div style={{ ...s.srFill, width:`${sr.strength}%`, background: sr.type.includes('SUPPORT')?'var(--green)':'var(--red)' }} /></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── INDICATORS ── */}
              <div style={{ ...s.card }} className="fu4">
                <div style={s.cardHead}><span style={s.cardTitle}>INDICATORS</span></div>

                <IndBlock label="RSI (14)" value={f(data.rsi,1)}
                  color={data.rsi>70?'var(--red)':data.rsi<30?'var(--green)':'var(--text)'}
                  badge={data.rsi>70?'OVERBOUGHT':data.rsi<30?'OVERSOLD':'NEUTRAL'} >
                  <div style={s.rsiTrack}>
                    <div style={{...s.rsiOSZone, left:'0%', width:'30%'}} />
                    <div style={{...s.rsiOBZone, left:'70%', width:'30%'}} />
                    <div style={{...s.rsiThumb, left:`${Math.min(100,Math.max(0,data.rsi))}%`}} />
                  </div>
                  <div style={s.rsiLbls}><span>OS 30</span><span>50</span><span>70 OB</span></div>
                </IndBlock>

                <IndBlock label="MACD">
                  <div style={s.indRows}>
                    <span style={s.micro2}>Line</span><span style={{...s.micro, color:data.macd.macd>0?'var(--green)':'var(--red)'}}>{f(data.macd.macd,4)}</span>
                    <span style={s.micro2}>Signal</span><span style={s.micro}>{f(data.macd.signal,4)}</span>
                    <span style={s.micro2}>Hist</span><span style={{...s.micro, color:data.macd.histogram>0?'var(--green)':'var(--red)'}}>{fSign(data.macd.histogram,4)}</span>
                  </div>
                </IndBlock>

                <IndBlock label="BOLLINGER BANDS (20)">
                  <div style={s.indRows}>
                    <span style={s.micro2}>Upper</span><span style={s.micro}>{f(data.bbands.upper)}</span>
                    <span style={s.micro2}>Mid</span><span style={{...s.micro, color:'var(--gold)'}}>{f(data.bbands.middle)}</span>
                    <span style={s.micro2}>Lower</span><span style={s.micro}>{f(data.bbands.lower)}</span>
                    <span style={s.micro2}>Width</span><span style={s.micro}>{f(((data.bbands.upper-data.bbands.lower)/data.bbands.middle)*100,2)}%</span>
                  </div>
                </IndBlock>

                <IndBlock label="ATR (14)" value={f(data.atr,2)} color="var(--gold)">
                  <div style={s.indRows}>
                    <span style={s.micro2}>% of Price</span>
                    <span style={s.micro}>{f((data.atr/data.quote.close)*100,3)}%</span>
                  </div>
                </IndBlock>
              </div>

              {/* ── CONFLUENCE + NARRATIVE ── */}
              <div style={{ ...s.card, gridColumn:'1 / -1' }} className="fu5">
                <div style={s.cardHead}>
                  <span style={s.cardTitle}>AI NARRATIVE & CONFLUENCES</span>
                  <span style={s.gptTag}>GPT-4o mini</span>
                </div>
                <div style={s.narrativeGrid}>
                  <div style={s.narrativeText}>{data.narrative}</div>
                  <div style={s.confluenceList}>
                    <div style={s.micro2} className="fu">CONFLUENCES ({sig?.confluences?.length})</div>
                    {sig?.confluences?.map((c,i) => (
                      <div key={i} style={s.confluenceItem}>
                        <span style={s.confDot}>◆</span>
                        <span style={s.confText}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── NEWS RISK BANNER ── */}
              {data.news && (
                <div style={{ ...s.card, gridColumn:'1 / -1', borderColor: newsRiskBorderColor(data.news.risk.level) }} className="fu5">
                  <div style={s.cardHead}>
                    <span style={s.cardTitle}>ECONOMIC CALENDAR · FOREX FACTORY</span>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <span style={{ ...s.riskBadge, color: newsRiskColor(data.news.risk.level), borderColor: newsRiskColor(data.news.risk.level), background: newsRiskBg(data.news.risk.level) }}>
                        {newsRiskIcon(data.news.risk.level)} {data.news.risk.label}
                      </span>
                      <span style={s.micro2}>USD FUNDAMENTAL BIAS:</span>
                      <span style={{ ...s.micro, color: data.news.bias.bias==='BULLISH_GOLD'?'var(--green)':data.news.bias.bias==='BEARISH_GOLD'?'var(--red)':'var(--amber)' }}>
                        {data.news.bias.bias.replace('_',' ')} ({data.news.bias.score > 0 ? '+' : ''}{data.news.bias.score})
                      </span>
                    </div>
                  </div>

                  {/* Risk explanation */}
                  <div style={s.newsRiskBar}>
                    <span style={{ ...s.newsRiskDot, background: newsRiskColor(data.news.risk.level) }} />
                    <span style={{ ...s.micro, color: newsRiskColor(data.news.risk.level) }}>{data.news.risk.reason}</span>
                    {data.news.risk.avoid && (
                      <span style={s.avoidBadge}>⚠ STAY OUT OF MARKET</span>
                    )}
                  </div>

                  {/* Fundamental bias summary */}
                  {data.news.bias.summary !== 'No released USD data today' && (
                    <div style={s.biasSummary}>
                      <span style={s.micro2}>RELEASED DATA:</span>
                      <span style={{ ...s.micro, color:'var(--text2)' }}>{data.news.bias.summary}</span>
                    </div>
                  )}

                  {/* News grid */}
                  <div style={s.newsGrid}>

                    {/* Today's events */}
                    <div>
                      <div style={{ ...s.micro2, marginBottom:10 }}>TODAY — USD HIGH IMPACT</div>
                      {data.news.today.filter(e => e.Impact === 'High').length === 0 && (
                        <div style={s.noNews}>No high-impact USD events today</div>
                      )}
                      {data.news.today.filter(e => e.Impact === 'High').map((e,i) => (
                        <NewsRow key={i} event={e} />
                      ))}
                    </div>

                    {/* Upcoming high-impact this week */}
                    <div>
                      <div style={{ ...s.micro2, marginBottom:10 }}>THIS WEEK — UPCOMING HIGH IMPACT</div>
                      {data.news.upcoming.length === 0 && (
                        <div style={s.noNews}>No high-impact USD events remaining this week</div>
                      )}
                      {data.news.upcoming.map((e,i) => (
                        <NewsRow key={i} event={e} upcoming />
                      ))}
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* ── FOOTER ── */}
            <footer style={s.footer}>
              <div style={s.footerLeft}>
                <span style={s.footerBrand}>PIPNEXUS © {new Date().getFullYear()}</span>
                <span style={s.footerRole}>Founder & CTO: <strong>Rolland Muhanguzi</strong></span>
                <span style={s.footerRole}>CEO: <strong>Shema Troy Tukahirwa</strong></span>
              </div>
              <div style={s.footerCenter}>
                <span style={{color:'var(--text3)'}}>Educational purposes only · Not financial advice</span>
              </div>
              {lastUp && <span style={s.footerRight}>Last update: {lastUp.toLocaleTimeString()}</span>}
            </footer>
          </main>
        )}
      </div>
    </>
  )
}

// ── News helpers ──────────────────────────────────────────────────────────────
const newsRiskColor = (l:string) => l==='RED'?'var(--red)':l==='ORANGE'?'var(--amber)':l==='YELLOW'?'#e8c97a':'var(--green)'
const newsRiskBg    = (l:string) => l==='RED'?'rgba(224,92,106,0.1)':l==='ORANGE'?'rgba(240,165,0,0.1)':l==='YELLOW'?'rgba(232,201,122,0.08)':'rgba(61,220,151,0.08)'
const newsRiskBorderColor = (l:string) => l==='RED'?'rgba(224,92,106,0.4)':l==='ORANGE'?'rgba(240,165,0,0.3)':l==='YELLOW'?'rgba(232,201,122,0.2)':'var(--border)'
const newsRiskIcon  = (l:string) => l==='RED'?'⛔':l==='ORANGE'?'⚠':l==='YELLOW'?'◉':'✓'
const impactColor   = (imp:string) => imp==='High'?'var(--red)':imp==='Medium'?'var(--amber)':imp==='Low'?'#8892a0':'var(--text3)'

function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.replace(/\./g, '-').replace(' ', 'T') + 'Z')
    return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  } catch { return dateStr }
}

function NewsRow({ event, upcoming }: { event: any; upcoming?: boolean }) {
  const hasActual = event.Actual !== null && event.Actual !== undefined
  const isStrong  = event.Strength === 'Strong Data'
  const isWeak    = event.Strength === 'Weak Data'
  return (
    <div style={ns.row}>
      <div style={ns.time}>{formatEventDate(event.Date)}</div>
      <div style={{ ...ns.impactDot, background: impactColor(event.Impact), boxShadow:`0 0 5px ${impactColor(event.Impact)}` }} />
      <div style={ns.name}>
        <span style={ns.eventName}>{event.Name}</span>
        {event.Category && <span style={ns.category}>{event.Category}</span>}
      </div>
      <div style={ns.figures}>
        {hasActual ? (
          <>
            <span style={{ ...ns.actual, color: isStrong?'var(--green)':isWeak?'var(--red)':'var(--text)' }}>
              A: {event.Actual}
            </span>
            <span style={ns.forecast}>F: {event.Forecast ?? '—'}</span>
            <span style={ns.prev}>P: {event.Previous ?? '—'}</span>
          </>
        ) : (
          <>
            <span style={ns.forecast}>F: {event.Forecast ?? '—'}</span>
            <span style={ns.prev}>P: {event.Previous ?? '—'}</span>
            {upcoming && <span style={ns.pending}>PENDING</span>}
          </>
        )}
      </div>
      {hasActual && event.Strength && (
        <span style={{ ...ns.strengthBadge, color: isStrong?'var(--green)':isWeak?'var(--red)':'var(--text3)', borderColor: isStrong?'var(--green)':isWeak?'var(--red)':'var(--text3)' }}>
          {isStrong ? '↑' : isWeak ? '↓' : '~'} {event.Strength}
        </span>
      )}
    </div>
  )
}

const ns: Record<string,React.CSSProperties> = {
  row:          { display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderBottom:'1px solid var(--border)', fontSize:11 },
  time:         { fontFamily:'var(--mono)', fontSize:10, color:'var(--text3)', minWidth:46, flexShrink:0 },
  impactDot:    { width:7, height:7, borderRadius:'50%', flexShrink:0 },
  name:         { flex:1, display:'flex', flexDirection:'column', gap:1 },
  eventName:    { color:'var(--text)', fontSize:11, fontWeight:500 },
  category:     { color:'var(--text3)', fontSize:9, letterSpacing:'0.05em' },
  figures:      { display:'flex', gap:8, fontSize:10, fontFamily:'var(--mono)' },
  actual:       { fontWeight:700 },
  forecast:     { color:'var(--text3)' },
  prev:         { color:'var(--text3)' },
  pending:      { fontSize:8, letterSpacing:'0.1em', color:'var(--amber)', border:'1px solid var(--amber)', padding:'1px 5px', borderRadius:2 },
  strengthBadge:{ fontSize:8, letterSpacing:'0.08em', border:'1px solid', padding:'2px 6px', borderRadius:2, flexShrink:0 },
}

// ── Sub-components ────────────────────────────────────────────────────────────
function LevelRow({ label, value, color, diff, diffColor, rrBadge, main }:
  { label:string; value:string; color:string; diff?:string; diffColor?:string; rrBadge?:string; main?:boolean }) {
  return (
    <div style={{ ...s.lvRow, ...(main ? { background:'rgba(201,168,76,0.05)', borderRadius:4 } : {}) }}>
      <span style={s.lvLabel}>{label}</span>
      <span style={{ ...s.lvValue, color, fontSize: main?'13px':'15px' }}>{value}</span>
      <span style={{ ...s.lvDiff, color: diffColor??'var(--text3)' }}>{diff??''}</span>
      {rrBadge && <span style={s.rrBadge}>{rrBadge}</span>}
    </div>
  )
}

function IndBlock({ label, value, color, badge, children }:
  { label:string; value?:string; color?:string; badge?:string; children?:React.ReactNode }) {
  return (
    <div style={s.indBlock}>
      <div style={s.indHead}>
        <span style={s.micro2}>{label}</span>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {value && <span style={{ ...s.micro, color:color??'var(--text)' }}>{value}</span>}
          {badge && <span style={{ ...s.badge, color:color??'var(--text2)', borderColor:color??'var(--border)' }}>{badge}</span>}
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  header: { position:'sticky', top:0, zIndex:100, background:'rgba(6,7,10,0.85)', backdropFilter:'blur(24px) saturate(180%)', borderBottom:'1px solid rgba(201,168,76,0.2)', padding:'14px 28px', boxShadow:'0 4px 24px rgba(0,0,0,0.3)' },
  headerInner: { display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 },
  logo: { display:'flex', alignItems:'center', gap:16 },
  logoMark: { fontSize:36, color:'var(--gold)', filter:'drop-shadow(0 0 16px rgba(201,168,76,0.6)) drop-shadow(0 0 32px rgba(201,168,76,0.3))' },
  logoTitle: { fontFamily:'var(--serif)', fontSize:22, fontWeight:600, letterSpacing:'0.12em', color:'var(--gold2)' },
  logoSub: { fontSize:8, letterSpacing:'0.25em', color:'var(--text3)', marginTop:1 },
  livePrice: { display:'flex', flexDirection:'column', gap:2, marginLeft:16, paddingLeft:16, borderLeft:'1px solid var(--border)' },
  livePriceNum: { fontFamily:'var(--serif)', fontSize:24, fontWeight:600, color:'var(--text)', letterSpacing:'0.05em' },
  livePriceChg: { fontSize:11, letterSpacing:'0.06em' },
  controls: { display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  ivRow: { display:'flex', gap:4 },
  ivBtn: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(201,168,76,0.2)', color:'var(--text2)', fontFamily:'var(--mono)', fontSize:10, padding:'6px 13px', borderRadius:4, cursor:'pointer', letterSpacing:'0.08em', transition:'all 0.2s ease', boxShadow:'0 2px 8px rgba(0,0,0,0.2)' },
  ivBtnActive: { background:'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.08) 100%)', borderColor:'rgba(201,168,76,0.4)', color:'var(--gold)', boxShadow:'0 0 16px rgba(201,168,76,0.2), inset 0 1px 0 rgba(201,168,76,0.1)' },
  analyzeBtn: { background:'linear-gradient(135deg, #c9a84c 0%, #b89840 100%)', color:'#000', border:'none', fontFamily:'var(--mono)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', padding:'8px 20px', borderRadius:4, cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 4px 16px rgba(201,168,76,0.4), 0 2px 4px rgba(0,0,0,0.3)' },
  spinner: { width:12, height:12, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'#000', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' },
  toggleWrap: { display:'flex', alignItems:'center', gap:7, cursor:'pointer' },
  toggleBg: { width:32, height:18, borderRadius:9, border:'1px solid', position:'relative', transition:'all 0.2s', display:'flex', alignItems:'center', padding:2 },
  toggleThumb: { width:12, height:12, borderRadius:'50%', transition:'all 0.2s', flexShrink:0 },
  toggleLabel: { fontSize:9, letterSpacing:'0.15em', color:'var(--text3)' },
  error: { margin:'12px 24px', background:'var(--red2)', border:'1px solid var(--red)', color:'var(--red)', fontFamily:'var(--mono)', fontSize:12, padding:'10px 16px', borderRadius:4 },
  empty: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:'80px 24px', textAlign:'center' },
  emptyGlyph: { fontSize:72, color:'var(--gold)', opacity:0.4, animation:'glow 2s ease infinite', filter:'drop-shadow(0 0 24px rgba(201,168,76,0.3))' },
  emptyTitle: { fontFamily:'var(--serif)', fontSize:36, fontWeight:300, letterSpacing:'0.12em', color:'var(--gold2)', textShadow:'0 0 24px rgba(201,168,76,0.2)' },
  emptyDesc: { fontSize:12, color:'var(--text3)', letterSpacing:'0.08em' },
  emptyBtn: { marginTop:12, background:'transparent', border:'1px solid var(--border3)', color:'var(--gold)', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.12em', padding:'10px 28px', borderRadius:3, cursor:'pointer' },
  loadWrap: { padding:'48px 24px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:12 },
  loadBar: { width:280, height:1, background:'var(--bg3)', position:'relative', overflow:'hidden' },
  loadFill: { position:'absolute', inset:0, background:'linear-gradient(90deg, transparent, var(--gold), transparent)', backgroundSize:'200% 100%', animation:'shimmer 1.4s linear infinite' },
  loadText: { fontSize:11, color:'var(--text3)', letterSpacing:'0.06em' },
  main: { padding:'16px 24px', flex:1 },
  // AMD Banner
  amdBanner: { display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, background:'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter:'blur(12px)', border:'1px solid', borderRadius:8, padding:'16px 22px', marginBottom:16, boxShadow:'0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' },
  amdLeft: { display:'flex', alignItems:'flex-start', gap:14, flex:1 },
  amdPhaseIcon: { fontSize:24, flexShrink:0, marginTop:2 },
  amdPhaseLabel: { fontFamily:'var(--serif)', fontSize:16, fontWeight:600, letterSpacing:'0.1em', marginBottom:3 },
  amdDesc: { fontSize:12, color:'var(--text2)', maxWidth:500, lineHeight:1.5 },
  amdRight: { display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' },
  amdStat: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 as any },
  biasBadge: { border:'1px solid', fontFamily:'var(--mono)', fontSize:10, padding:'4px 10px', borderRadius:3, letterSpacing:'0.12em' },
  // Grid
  grid: { display:'grid', gridTemplateColumns:'1fr 280px', gap:14 },
  card: { background:'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter:'blur(12px)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:8, padding:'18px', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' },
  chartCard: { gridColumn:'1', gridRow:'1 / 3' },
  signalCard: { gridColumn:'2', gridRow:'1 / 4' },
  cardHead: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
  cardTitle: { fontSize:9, letterSpacing:'0.22em', color:'var(--text3)', fontWeight:700 },
  cardCount: { fontSize:9, letterSpacing:'0.1em', color:'var(--gold)', background:'var(--gold-dim)', padding:'2px 7px', borderRadius:2 },
  chartLegend: { display:'flex', gap:12, fontSize:9 },
  // Signal
  actionBox: { border:'2px solid', borderRadius:6, padding:'16px 18px', marginBottom:16, display:'flex', flexDirection:'column', gap:4, boxShadow:'0 0 24px currentColor, inset 0 1px 0 rgba(255,255,255,0.1)', position:'relative', overflow:'hidden' },
  actionVerb: { fontFamily:'var(--serif)', fontSize:36, fontWeight:800, letterSpacing:'0.12em', textShadow:'0 0 20px currentColor' },
  actionSub: { fontSize:9, letterSpacing:'0.2em', opacity:0.7 },
  confRow: { display:'flex', justifyContent:'space-between', marginBottom:5 },
  confTrack: { height:2, background:'var(--bg3)', borderRadius:1, overflow:'hidden', marginBottom:16 },
  confFill: { height:'100%', borderRadius:1, transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' },
  levelsGrid: { display:'flex', flexDirection:'column', gap:2, marginBottom:14 },
  lvRow: { display:'grid', gridTemplateColumns:'auto 1fr auto auto', alignItems:'center', gap:8, padding:'6px 8px' },
  lvLabel: { fontSize:9, letterSpacing:'0.1em', color:'var(--text3)', whiteSpace:'nowrap' as any },
  lvValue: { fontFamily:'var(--serif)', fontSize:15, fontWeight:600, textAlign:'right' as any },
  lvDiff: { fontSize:10, textAlign:'right' as any, minWidth:50 },
  rrBadge: { fontSize:9, padding:'2px 5px', background:'var(--green2)', color:'var(--green)', borderRadius:2, letterSpacing:'0.05em' },
  invalidation: { background:'rgba(224,92,106,0.05)', border:'1px solid rgba(224,92,106,0.15)', borderRadius:4, padding:'10px 12px' },
  invalidText: { fontSize:11, color:'var(--text2)', lineHeight:1.5, marginTop:4 },
  liveDot: { width:8, height:8, background:'var(--green)', borderRadius:'50%', animation:'pulse 1.5s ease infinite', boxShadow:'0 0 12px var(--green), 0 0 24px rgba(61,220,151,0.4)' },
  // OB
  obRow: { borderLeft:'3px solid', paddingLeft:12, marginBottom:10, display:'flex', gap:12, alignItems:'center', background:'rgba(255,255,255,0.02)', padding:'8px 8px 8px 12px', borderRadius:'0 4px 4px 0', transition:'all 0.2s ease' },
  obLeft: { display:'flex', flexDirection:'column', gap:3, minWidth:80 },
  obType: { fontSize:10, fontWeight:700, letterSpacing:'0.08em' },
  obStrength: { fontSize:9, letterSpacing:'0.1em' },
  obZone: { display:'flex', flexDirection:'column', gap:2 },
  obPrice: { fontSize:12, color:'var(--text)', fontFamily:'var(--serif)' },
  // FVG
  fvgRow: { borderLeft:'3px solid', paddingLeft:12, marginBottom:10, display:'flex', gap:10, alignItems:'center', background:'rgba(255,255,255,0.02)', padding:'8px 8px 8px 12px', borderRadius:'0 4px 4px 0', transition:'all 0.2s ease' },
  fvgBody: { flex:1, display:'flex', flexDirection:'column', gap:2 },
  fvgSize: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 },
  // S&R
  srRow: { display:'flex', alignItems:'center', gap:10, marginBottom:10, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:5, border:'1px solid rgba(255,255,255,0.05)', transition:'all 0.2s ease' },
  srDot: { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  srInfo: { flex:1, display:'flex', flexDirection:'column', gap:2 },
  srPrice: { fontFamily:'var(--serif)', fontSize:14, color:'var(--text)' },
  srTouches: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 },
  srBar: { width:50, height:2, background:'var(--bg4)', borderRadius:1 },
  srFill: { height:'100%', borderRadius:1 },
  // Indicators
  indBlock: { marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' },
  indHead: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  indRows: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 12px' },
  rsiTrack: { position:'relative', height:5, background:'var(--bg3)', borderRadius:3, margin:'6px 0', overflow:'visible' },
  rsiOSZone: { position:'absolute', top:0, height:'100%', background:'rgba(61,220,151,0.12)' },
  rsiOBZone: { position:'absolute', top:0, height:'100%', background:'rgba(224,92,106,0.12)' },
  rsiThumb: { position:'absolute', top:-4, width:12, height:12, background:'var(--gold)', borderRadius:'50%', transform:'translateX(-50%)', border:'2px solid var(--bg2)', boxShadow:'0 0 12px rgba(201,168,76,0.6), 0 0 6px rgba(201,168,76,0.4)' },
  rsiLbls: { display:'flex', justifyContent:'space-between', fontSize:8, color:'var(--text3)', marginTop:4 },
  // Narrative
  narrativeGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  narrativeText: { fontFamily:'var(--serif)', fontSize:15, fontWeight:300, lineHeight:1.8, color:'var(--text2)', fontStyle:'italic' },
  confluenceList: { display:'flex', flexDirection:'column', gap:6 },
  confluenceItem: { display:'flex', gap:8, alignItems:'flex-start' },
  confDot: { color:'var(--gold)', fontSize:8, marginTop:3, flexShrink:0 },
  confText: { fontSize:11, color:'var(--text2)', lineHeight:1.5 },
  // Common
  micro:  { fontSize:10, letterSpacing:'0.06em', color:'var(--text2)' },
  micro2: { fontSize:9, letterSpacing:'0.1em', color:'var(--text3)' },
  badge:  { fontSize:8, padding:'2px 7px', border:'1px solid', borderRadius:2, letterSpacing:'0.1em' },
  empty2: { fontSize:11, color:'var(--text3)', padding:'12px 0' },
  gptTag: { fontSize:9, padding:'3px 8px', background:'var(--gold-dim)', border:'1px solid var(--border2)', color:'var(--gold)', borderRadius:2, letterSpacing:'0.06em' },
  footer: { borderTop:'1px solid var(--border)', padding:'16px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:9, color:'var(--text3)', letterSpacing:'0.06em', marginTop:8, flexWrap:'wrap', gap:12, background:'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter:'blur(8px)' },
  footerLeft: { display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' },
  footerBrand: { fontFamily:'var(--serif)', fontSize:11, letterSpacing:'0.15em', color:'var(--gold)', fontWeight:700 },
  footerRole: { fontSize:9, color:'var(--text3)' },
  footerCenter: { flex:1, textAlign:'center', minWidth:200 },
  footerRight: { fontSize:9, color:'var(--text2)' },
  // GoldAPI Spot Strip
  spotStrip:    { display:'flex', alignItems:'center', gap:0, background:'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter:'blur(12px)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'14px 20px', marginBottom:16, flexWrap:'wrap' as any, boxShadow:'0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)' },
  spotDivider:  { width:1, height:44, background:'var(--border)', margin:'0 16px', flexShrink:0 },
  spotPriceBlock:{ display:'flex', flexDirection:'column', gap:3, minWidth:80 },
  spotLabel:    { fontSize:8, letterSpacing:'0.18em', color:'var(--text3)' },
  spotBid:      { fontFamily:'var(--serif)', fontSize:20, fontWeight:600, color:'var(--green)' },
  spotAsk:      { fontFamily:'var(--serif)', fontSize:20, fontWeight:600, color:'var(--red)' },
  spotMid:      { fontFamily:'var(--serif)', fontSize:18, fontWeight:600, color:'var(--gold2)' },
  spotSpread:   { fontFamily:'var(--mono)', fontSize:13, fontWeight:700 },
  goldapiTag:   { fontSize:9, padding:'3px 9px', background:'rgba(201,168,76,0.08)', border:'1px solid var(--border2)', color:'var(--gold)', borderRadius:2, letterSpacing:'0.1em' },
  // Weekly range bar
  weeklyRangeBlock: { display:'flex', flexDirection:'column', gap:4, minWidth:220 },
  weeklyRangeRow:   { display:'flex', alignItems:'center', gap:8 },
  weeklyTrack:      { flex:1, height:4, background:'var(--bg3)', borderRadius:2, position:'relative', overflow:'visible' },
  weeklyMidLine:    { position:'absolute', left:'50%', top:-2, width:1, height:8, background:'var(--border2)' },
  weeklyThumb:      { position:'absolute', top:-4, width:10, height:10, background:'var(--gold)', borderRadius:'50%', transform:'translateX(-50%)', border:'2px solid var(--bg2)', transition:'left 0.5s ease', boxShadow:'0 0 10px rgba(201,168,76,0.6)' },
  // Gram prices
  gramBlock:   { display:'flex', flexDirection:'column', gap:6 },
  gramRow:     { display:'flex', gap:12 },
  gramItem:    { display:'flex', flexDirection:'column', gap:2 },
  gramLabel:   { fontSize:8, letterSpacing:'0.12em', color:'var(--gold)', background:'var(--gold-dim)', padding:'1px 5px', borderRadius:2 },
  gramVal:     { fontFamily:'var(--mono)', fontSize:12, color:'var(--text)' },
  // News panel
  riskBadge:    { fontSize:9, padding:'3px 10px', border:'1px solid', borderRadius:2, letterSpacing:'0.1em', fontWeight:700 },
  newsRiskBar:  { display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'8px 10px', background:'var(--bg3)', borderRadius:4 },
  newsRiskDot:  { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  avoidBadge:   { marginLeft:'auto', fontSize:9, padding:'3px 10px', background:'rgba(224,92,106,0.15)', color:'var(--red)', border:'1px solid var(--red)', borderRadius:2, letterSpacing:'0.1em' },
  biasSummary:  { display:'flex', gap:10, alignItems:'flex-start', marginBottom:14, padding:'8px 10px', background:'var(--bg3)', borderRadius:4 },
  newsGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  noNews:       { fontSize:11, color:'var(--text3)', padding:'12px 8px' },
}
