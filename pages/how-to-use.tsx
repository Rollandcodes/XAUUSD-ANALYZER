import Head from 'next/head'
import Link from 'next/link'

export default function HowToUse() {
  const sections = [
    {
      title: 'Getting Started',
      icon: '◈',
      content: `Welcome to PipNexus! Here's how to get started:

1. **Visit the Terminal**: Navigate to the main terminal page
2. **Click "Analyze"**: Click the analyze button to fetch current market data
3. **Select Timeframe**: Choose your preferred timeframe (M15, H1, H4, D1)
4. **Review Signals**: Check the generated buy/sell signals and confidence levels
5. **Enable Auto-Refresh**: Toggle auto-refresh for continuous monitoring`
    },
    {
      title: 'Understanding AMD Phases',
      icon: '◈',
      content: `AMD (Accumulation, Manipulation, Distribution) is the core of our analysis:

- **Accumulation**: Smart money is buying — look for buy setups
- **Distribution**: Smart money is selling — look for sell setups
- **Manipulation**: Stop hunt in progress — wait for confirmation
- **Decline**: Sustained downtrend — bearish bias

The bias indicator shows the current market direction.`
    },
    {
      title: 'Reading Trade Signals',
      icon: '◈',
      content: `Each signal includes:

- **Action**: BUY, SELL, or WAIT
- **Confidence**: Percentage (70%+ is high confidence)
- **Entry Zone**: Optimal entry price range
- **Stop Loss**: Maximum risk level
- **TP1/TP2/TP3**: Take profit targets with R:R ratios
- **Confluences**: Multiple factors supporting the signal`
    },
    {
      title: 'API Key Setup',
      icon: '◈',
      content: `For full functionality, configure these API keys:

  1. **Alpha Vantage, Marketstack, Finnhub** (required): Market data fallback chain
    - Get API keys at alphavantage.co, marketstack.com, and finnhub.io

2. **Anthropic Claude** (required): AI analysis
   - Get your API key at anthropic.com

3. **GoldAPI.io** (optional): Real-time spot prices
   - Get your API key at goldapi.io

4. **Trading Economics** (optional): Economic calendar
   - Get your API key at tradingeconomics.com`
    },
    {
      title: 'Risk Management',
      icon: '◈',
      content: `Always follow proper risk management:

- **Never risk more than 1-2%** per trade
- **Use the suggested stop loss** levels
- **Aim for at least 1:2 risk-reward**
- **Check news risk** before trading
- **Wait for high-confidence** signals (70%+)`
    },
    {
      title: 'FAQ',
      icon: '?',
      items: [
        { q: 'Is PipNexus free?', a: 'The terminal is free to use. API keys may require accounts with the respective providers.' },
        { q: 'How accurate are signals?', a: 'Our win rate historically averages around 70%, but past performance doesn\'t guarantee future results.' },
        { q: 'Can I trade automatically?', a: 'PipNexus provides signals for manual trading only. Always verify signals with your own analysis.' },
        { q: 'What timeframe is best?', a: 'H1 is recommended for most traders. H4 for swing traders, M15 for day traders.' },
        { q: 'Why do some signals say WAIT?', a: 'When technicals and fundamentals conflict, or during high-impact news, we recommend waiting.' },
      ]
    }
  ]

  return (
    <>
      <Head>
        <title>How to Use - PipNexus</title>
        <meta name="description" content="Learn how to use PipNexus AI trading terminal" />
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
            <Link href="/history" style={s.navLink}>History</Link>
            <Link href="/reviews" style={s.navLink}>Reviews</Link>
            <Link href="/waitlist" style={s.navWaitlist}>Join Waitlist</Link>
          </nav>
        </header>

        <main style={s.main}>
          {/* Page Title */}
          <div style={s.pageHeader}>
            <h1 style={s.pageTitle}>How to Use PipNexus</h1>
            <p style={s.pageDesc}>A complete guide to using our AI-powered trading terminal</p>
          </div>

          {/* Content Sections */}
          {sections.map((section, i) => (
            <div key={i} style={{...s.section, animationDelay: `${i * 0.1}s`}} className="fu">
              <div style={s.sectionHeader}>
                <span style={s.sectionIcon}>{section.icon}</span>
                <h2 style={s.sectionTitle}>{section.title}</h2>
              </div>

              {section.content && (
                <div style={s.sectionContent}>
                  {section.content.split('\n').map((line, j) => {
                    if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') ||
                        line.startsWith('4.') || line.startsWith('5.')) {
                      return <li key={j} style={s.listItem}>{line.substring(2)}</li>
                    }
                    if (line.startsWith('- **')) {
                      const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)/)
                      if (match) {
                        return (
                          <div key={j} style={s.termRow}>
                            <strong style={s.term}>{match[1]}</strong>
                            <span style={s.termDesc}>{match[2]}</span>
                          </div>
                        )
                      }
                    }
                    return line.trim() ? <p key={j} style={s.para}>{line}</p> : null
                  })}
                </div>
              )}

              {section.items && (
                <div style={s.faqList}>
                  {section.items.map((item, j) => (
                    <div key={j} style={s.faqItem}>
                      <div style={s.faqQ}>{item.q}</div>
                      <div style={s.faqA}>{item.a}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
    --bg: #06070a; --text: #eae8e0; --text2: #c5c2b8; --text3: #9a9280;
    --gold: #c9a84c; --gold2: #e8c97a; --green: #3ddc97; --red: #e05c6a;
    --serif: 'Bricolage Grotesque', 'Inter', -apple-system, sans-serif;
    --mono: 'JetBrains Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: var(--serif); font-size: 14px; line-height: 1.7; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .fu { animation: fadeUp 0.5s ease forwards; opacity: 0; }
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
  navLink: { fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text2)', textDecoration: 'none', padding: '8px 14px', borderRadius: '4px' },
  navWaitlist: { fontSize: '11px', letterSpacing: '0.1em', color: '#000', background: 'linear-gradient(135deg, #c9a84c 0%, #b89840 100%)', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 600 },
  main: { padding: '40px', maxWidth: '900px', margin: '0 auto' },
  pageHeader: { textAlign: 'center', marginBottom: '48px' },
  pageTitle: { fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 300, letterSpacing: '0.1em', color: 'var(--gold2)', marginBottom: '12px' },
  pageDesc: { fontSize: '14px', color: 'var(--text2)' },
  section: { background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(184,152,90,0.15)', borderRadius: '12px', padding: '28px', marginBottom: '20px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  sectionIcon: { fontSize: '20px', color: 'var(--gold)' },
  sectionTitle: { fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 500, color: 'var(--text)' },
  sectionContent: { color: 'var(--text2)', fontSize: '14px', lineHeight: 1.8 },
  para: { marginBottom: '12px' },
  listItem: { marginLeft: '20px', marginBottom: '8px', listStyle: 'disc' },
  termRow: { display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' },
  term: { color: 'var(--gold)', fontWeight: 600 },
  termDesc: { color: 'var(--text2)' },
  faqList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  faqItem: { padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' },
  faqQ: { fontWeight: 600, color: 'var(--text)', marginBottom: '8px', fontSize: '14px' },
  faqA: { fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 },
  footer: { borderTop: '1px solid rgba(184,152,90,0.12)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  footerBrand: { fontFamily: 'var(--serif)', fontSize: '12px', letterSpacing: '0.15em', color: 'var(--gold)' },
  footerText: { fontSize: '11px', color: 'var(--text3)' },
}
