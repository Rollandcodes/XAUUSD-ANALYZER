import Head from 'next/head'
import Link from 'next/link'

export default function History() {
  // Sample historical signals for demonstration
  const signals = [
    { date: '2026-02-22', action: 'BUY', entry: 2652.40, sl: 2645.00, tp: 2665.00, result: 'WIN', pips: 126, confidence: 78 },
    { date: '2026-02-21', action: 'SELL', entry: 2648.20, sl: 2655.00, tp: 2638.00, result: 'WIN', pips: 102, confidence: 72 },
    { date: '2026-02-20', action: 'WAIT', entry: 2645.50, sl: 0, tp: 0, result: 'NEUTRAL', pips: 0, confidence: 45 },
    { date: '2026-02-19', action: 'BUY', entry: 2638.80, sl: 2632.00, tp: 2650.00, result: 'WIN', pips: 112, confidence: 75 },
    { date: '2026-02-18', action: 'SELL', entry: 2655.30, sl: 2662.00, tp: 2645.00, result: 'LOSS', pips: -67, confidence: 68 },
    { date: '2026-02-17', action: 'BUY', entry: 2642.10, sl: 2635.00, tp: 2655.00, result: 'WIN', pips: 129, confidence: 80 },
    { date: '2026-02-16', action: 'WAIT', entry: 2635.80, sl: 0, tp: 0, result: 'NEUTRAL', pips: 0, confidence: 40 },
    { date: '2026-02-15', action: 'SELL', entry: 2668.40, sl: 2675.00, tp: 2658.00, result: 'WIN', pips: 104, confidence: 71 },
  ]

  const stats = {
    totalSignals: 47,
    winRate: 72.3,
    avgPips: 89.5,
    bestTrade: 156,
    worstTrade: -82,
    consecutiveWins: 4,
    consecutiveLosses: 2,
  }

  return (
    <>
      <Head>
        <title>History & Performance - PipNexus</title>
        <meta name="description" content="View PipNexus historical trading signals and performance statistics" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⬡</text></svg>" />
        <style>{styles}</style>
      </Head>

      <div style={s.container}>
        <div style={s.bg}>
          <div style={s.bg1} />
          <div style={s.bg2} />
        </div>

        {/* Header */}
        <header style={s.header}>
          <Link href="/" style={s.logo}>
            <span style={s.logoMark}>⬡</span>
            <div>
              <div style={s.logoTitle}>PIPNEXUS</div>
              <div style={s.logoSub}>XAU/USD · ICT INTELLIGENCE</div>
            </div>
          </Link>
          <nav style={s.nav}>
            <Link href="/" style={s.navLink}>Terminal</Link>
            <Link href="/about" style={s.navLink}>About</Link>
            <Link href="/history" style={{...s.navLink, color:'var(--gold)'}}>History</Link>
            <Link href="/reviews" style={s.navLink}>Reviews</Link>
            <Link href="/waitlist" style={s.navWaitlist}>Join Waitlist</Link>
          </nav>
        </header>

        <main style={s.main}>
          {/* Page Title */}
          <div style={s.pageHeader}>
            <h1 style={s.pageTitle}>Signal History</h1>
            <p style={s.pageDesc}>Track our past trading signals and their outcomes</p>
          </div>

          {/* Stats Overview */}
          <div style={s.statsGrid}>
            <div style={s.statCard}>
              <div style={s.statLabel}>TOTAL SIGNALS</div>
              <div style={s.statValue}>{stats.totalSignals}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>WIN RATE</div>
              <div style={{...s.statValue, color: 'var(--green)'}}>{stats.winRate}%</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>AVG PIPS</div>
              <div style={{...s.statValue, color: 'var(--gold)'}}>+{stats.avgPips}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>BEST TRADE</div>
              <div style={{...s.statValue, color: 'var(--green)'}}>+{stats.bestTrade} pips</div>
            </div>
          </div>

          {/* Signals Table */}
          <div style={s.tableCard}>
            <div style={s.tableHeader}>
              <span style={s.colDate}>DATE</span>
              <span style={s.colAction}>ACTION</span>
              <span style={s.colEntry}>ENTRY</span>
              <span style={s.colSL}>STOP</span>
              <span style={s.colTP}>TARGET</span>
              <span style={s.colResult}>RESULT</span>
              <span style={s.colConf}>CONF</span>
            </div>

            {signals.map((signal, i) => (
              <div key={i} style={{...s.tableRow, animationDelay: `${i * 0.05}s`}} className="fu">
                <span style={s.colDate}>{signal.date}</span>
                <span style={{
                  ...s.colAction,
                  color: signal.action === 'BUY' ? 'var(--green)' : signal.action === 'SELL' ? 'var(--red)' : 'var(--amber)',
                }}>{signal.action}</span>
                <span style={s.colEntry}>{signal.entry.toFixed(2)}</span>
                <span style={{...s.colSL, color: signal.sl === 0 ? 'var(--text3)' : 'var(--red)'}}>
                  {signal.sl === 0 ? '—' : signal.sl.toFixed(2)}
                </span>
                <span style={{...s.colTP, color: signal.tp === 0 ? 'var(--text3)' : 'var(--green)'}}>
                  {signal.tp === 0 ? '—' : signal.tp.toFixed(2)}
                </span>
                <span style={{
                  ...s.colResult,
                  color: signal.result === 'WIN' ? 'var(--green)' : signal.result === 'LOSS' ? 'var(--red)' : 'var(--amber)',
                }}>
                  {signal.result === 'WIN' ? `+${signal.pips} pips` : signal.result === 'LOSS' ? `${signal.pips} pips` : '—'}
                </span>
                <span style={s.colConf}>
                  <span style={{
                    ...s.confDot,
                    background: signal.confidence >= 70 ? 'var(--green)' : signal.confidence >= 50 ? 'var(--amber)' : 'var(--red)',
                  }} />
                  {signal.confidence}%
                </span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={s.disclaimer}>
            <strong>Past performance does not guarantee future results.</strong> Trading involves significant risk.
            These signals are for educational purposes only and should not be considered financial advice.
          </div>
        </main>

        {/* Footer */}
        <footer style={s.footer}>
          <div style={s.footerBrand}>PIPNEXUS © {new Date().getFullYear()}</div>
          <div style={s.footerText}>Educational purposes only · Not financial advice</div>
        </footer>
      </div>
    </>
  )
}

const styles = `
  :root {
    --bg: #06070a; --bg2: #0d0f14;
    --text: #eae8e0; --text2: #c5c2b8; --text3: #9a9280;
    --gold: #c9a84c; --gold2: #e8c97a;
    --green: #3ddc97; --red: #e05c6a;
    --serif: 'Bricolage Grotesque', 'Inter', -apple-system, sans-serif;
    --mono: 'JetBrains Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: var(--serif); font-size: 14px; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .fu { animation: fadeUp 0.4s ease forwards; opacity: 0; }
`

const s: Record<string, any> = {
  container: { minHeight: '100vh', position: 'relative', zIndex: 1, background: 'linear-gradient(135deg, #050609 0%, #0a0b0e 50%, #0d0f14 100%)' },
  bg: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' },
  bg1: { position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)', filter: 'blur(80px)' },
  bg2: { position: 'absolute', bottom: '-15%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(61,220,151,0.06) 0%, transparent 70%)', filter: 'blur(100px)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid rgba(184,152,90,0.15)', background: 'rgba(6,7,10,0.8)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 },
  logo: { display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' },
  logoMark: { fontSize: '32px', color: 'var(--gold)', filter: 'drop-shadow(0 0 12px rgba(201,168,76,0.5))' },
  logoTitle: { fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--gold2)' },
  logoSub: { fontSize: '7px', letterSpacing: '0.25em', color: 'var(--text3)' },
  nav: { display: 'flex', alignItems: 'center', gap: '8px' },
  navLink: { fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text2)', textDecoration: 'none', padding: '8px 14px', borderRadius: '4px', transition: 'all 0.2s' },
  navWaitlist: { fontSize: '11px', letterSpacing: '0.1em', color: '#000', background: 'linear-gradient(135deg, #c9a84c 0%, #b89840 100%)', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 600 },
  main: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  pageHeader: { textAlign: 'center', marginBottom: '40px' },
  pageTitle: { fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 300, letterSpacing: '0.1em', color: 'var(--gold2)', marginBottom: '12px' },
  pageDesc: { fontSize: '14px', color: 'var(--text2)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(184,152,90,0.15)', borderRadius: '10px', padding: '20px', textAlign: 'center' },
  statLabel: { fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text3)', marginBottom: '8px' },
  statValue: { fontFamily: 'var(--mono)', fontSize: '24px', fontWeight: 600, color: 'var(--text)' },
  tableCard: { background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(184,152,90,0.15)', borderRadius: '10px', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '100px 80px 100px 80px 80px 120px 80px', gap: '12px', padding: '14px 20px', background: 'rgba(184,152,90,0.08)', borderBottom: '1px solid rgba(184,152,90,0.15)', fontSize: '9px', letterSpacing: '0.12em', color: 'var(--text3)' },
  tableRow: { display: 'grid', gridTemplateColumns: '100px 80px 100px 80px 80px 120px 80px', gap: '12px', padding: '14px 20px', borderBottom: '1px solid rgba(184,152,90,0.08)', fontSize: '12px', alignItems: 'center', fontFamily: 'var(--mono)' },
  colDate: { color: 'var(--text3)' },
  colAction: { fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em' },
  colEntry: { color: 'var(--text)' },
  colSL: { color: 'var(--red)' },
  colTP: { color: 'var(--green)' },
  colResult: { fontWeight: 600, fontSize: '11px' },
  colConf: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text2)' },
  confDot: { width: '6px', height: '6px', borderRadius: '50%' },
  disclaimer: { marginTop: '24px', padding: '16px', background: 'rgba(184,152,90,0.05)', border: '1px solid rgba(184,152,90,0.15)', borderRadius: '8px', fontSize: '11px', color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6 },
  footer: { borderTop: '1px solid rgba(184,152,90,0.12)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  footerBrand: { fontFamily: 'var(--serif)', fontSize: '12px', letterSpacing: '0.15em', color: 'var(--gold)' },
  footerText: { fontSize: '11px', color: 'var(--text3)' },
}
