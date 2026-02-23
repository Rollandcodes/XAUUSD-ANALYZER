import Head from 'next/head'
import Link from 'next/link'

export default function About() {
  return (
    <>
      <Head>
        <title>About - PipNexus</title>
        <meta name="description" content="Learn about PipNexus - AI-powered XAU/USD gold trading terminal" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⬡</text></svg>" />
        <style>{styles}</style>
      </Head>

      <div style={s.container}>
        {/* Ambient background */}
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
            <Link href="/about" style={{...s.navLink, color:'var(--gold)'}}>About</Link>
            <Link href="/history" style={s.navLink}>History</Link>
            <Link href="/reviews" style={s.navLink}>Reviews</Link>
            <Link href="/waitlist" style={s.navWaitlist}>Join Waitlist</Link>
          </nav>
        </header>

        {/* Hero */}
        <section style={s.hero}>
          <h1 style={s.heroTitle}>
            The Future of <span style={s.gold}>Gold Trading</span>
          </h1>
          <p style={s.heroDesc}>
            PipNexus combines institutional-grade ICT methodology with cutting-edge AI to deliver
            professional-grade trading signals for XAU/USD.
          </p>
        </section>

        {/* Mission */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Our Mission</h2>
          <p style={s.sectionText}>
            We believe in democratizing access to professional trading intelligence. Our platform
            combines decades of trading wisdom from the ICT methodology with the analytical power
            of Claude AI to help traders make better-informed decisions.
          </p>
        </section>

        {/* Features Grid */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Technology Stack</h2>
          <div style={s.grid}>
            <div style={s.card}>
              <div style={s.cardIcon}>◈</div>
              <h3 style={s.cardTitle}>Anthropic Claude</h3>
              <p style={s.cardText}>
                Deep market analysis powered by Claude Sonnet 4 with extended reasoning capabilities
                for complex pattern recognition.
              </p>
            </div>
            <div style={s.card}>
              <div style={s.cardIcon}>◈</div>
              <h3 style={s.cardTitle}>Twelve Data</h3>
              <p style={s.cardText}>
                Real-time and historical OHLCV data with 150+ technical indicators for precise
                market analysis.
              </p>
            </div>
            <div style={s.card}>
              <div style={s.cardIcon}>◈</div>
              <h3 style={s.cardTitle}>GoldAPI.io</h3>
              <p style={s.cardText}>
                Live spot prices with bid/ask spread analysis for accurate entry and exit planning.
              </p>
            </div>
            <div style={s.card}>
              <div style={s.cardIcon}>◈</div>
              <h3 style={s.cardTitle}>ICT Methodology</h3>
              <p style={s.cardText}>
                Accumulation/Distribution phases, Order Blocks, Fair Value Gaps, and Smart Money
                Concepts.
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Leadership</h2>
          <div style={s.teamGrid}>
            <div style={s.teamCard}>
              <div style={s.teamAvatar}>RM</div>
              <h3 style={s.teamName}>Rolland Muhanguzi</h3>
              <div style={s.teamRole}>Founder & CTO</div>
              <p style={s.teamBio}>
                Full-stack developer and algorithmic trader with 8+ years of experience in
                financial technology and AI systems.
              </p>
            </div>
            <div style={s.teamCard}>
              <div style={s.teamAvatar}>ST</div>
              <h3 style={s.teamName}>Shema Troy Tukahirwa</h3>
              <div style={s.teamRole}>CEO</div>
              <p style={s.teamBio}>
                Business leader with expertise in fintech strategy and global market operations.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={s.cta}>
          <h2 style={s.ctaTitle}>Ready to Level Up Your Trading?</h2>
          <p style={s.ctaText}>
            Join our waitlist for early access to the most intelligent gold trading terminal.
          </p>
          <Link href="/waitlist" style={s.ctaBtn}>
            Join Waitlist →
          </Link>
        </section>

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
    --bg: #06070a; --bg2: #0d0f14; --bg3: #14161c;
    --text: #eae8e0; --text2: #c5c2b8; --text3: #9a9280;
    --border: rgba(184,152,90,0.12);
    --gold: #c9a84c; --gold2: #e8c97a;
    --green: #3ddc97; --red: #e05c6a;
    --serif: 'Bricolage Grotesque', 'Inter', -apple-system, system-ui, sans-serif;
    --mono: 'JetBrains Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.6;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fu { animation: fadeUp 0.5s ease; }
`

const s: Record<string, any> = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    zIndex: 1,
    background: 'linear-gradient(135deg, #050609 0%, #0a0b0e 50%, #0d0f14 100%)',
  },
  bg: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },
  bg1: {
    position: 'absolute',
    top: '-10%', left: '-10%',
    width: '40%', height: '40%',
    background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
    filter: 'blur(80px)',
  },
  bg2: {
    position: 'absolute',
    bottom: '-15%', right: '-10%',
    width: '50%', height: '50%',
    background: 'radial-gradient(circle, rgba(61,220,151,0.06) 0%, transparent 70%)',
    filter: 'blur(100px)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 40px',
    borderBottom: '1px solid rgba(184,152,90,0.15)',
    background: 'rgba(6,7,10,0.8)',
    backdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    textDecoration: 'none',
  },
  logoMark: {
    fontSize: '32px',
    color: 'var(--gold)',
    filter: 'drop-shadow(0 0 12px rgba(201,168,76,0.5))',
  },
  logoTitle: {
    fontFamily: 'var(--serif)',
    fontSize: '20px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    color: 'var(--gold2)',
  },
  logoSub: {
    fontSize: '7px',
    letterSpacing: '0.25em',
    color: 'var(--text3)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navLink: {
    fontSize: '11px',
    letterSpacing: '0.1em',
    color: 'var(--text2)',
    textDecoration: 'none',
    padding: '8px 14px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  },
  navWaitlist: {
    fontSize: '11px',
    letterSpacing: '0.1em',
    color: '#000',
    background: 'linear-gradient(135deg, #c9a84c 0%, #b89840 100%)',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  hero: {
    textAlign: 'center',
    padding: '100px 40px 60px',
  },
  heroTitle: {
    fontFamily: 'var(--serif)',
    fontSize: 'clamp(32px, 5vw, 56px)',
    fontWeight: 300,
    letterSpacing: '0.08em',
    marginBottom: '20px',
  },
  gold: {
    color: 'var(--gold2)',
  },
  heroDesc: {
    fontSize: '16px',
    color: 'var(--text2)',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.8,
  },
  section: {
    padding: '60px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontFamily: 'var(--serif)',
    fontSize: '28px',
    fontWeight: 400,
    letterSpacing: '0.08em',
    color: 'var(--gold2)',
    textAlign: 'center',
    marginBottom: '24px',
  },
  sectionText: {
    fontSize: '15px',
    color: 'var(--text2)',
    lineHeight: 1.8,
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(184,152,90,0.15)',
    borderRadius: '12px',
    padding: '28px',
    textAlign: 'center',
  },
  cardIcon: {
    fontSize: '24px',
    color: 'var(--gold)',
    marginBottom: '16px',
  },
  cardTitle: {
    fontFamily: 'var(--serif)',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: 'var(--text)',
    marginBottom: '12px',
  },
  cardText: {
    fontSize: '13px',
    color: 'var(--text2)',
    lineHeight: 1.7,
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  teamCard: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    border: '1px solid rgba(184,152,90,0.15)',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
  },
  teamAvatar: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.05) 100%)',
    border: '2px solid var(--gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--gold)',
    margin: '0 auto 16px',
  },
  teamName: {
    fontFamily: 'var(--serif)',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '4px',
  },
  teamRole: {
    fontSize: '11px',
    letterSpacing: '0.15em',
    color: 'var(--gold)',
    marginBottom: '16px',
  },
  teamBio: {
    fontSize: '13px',
    color: 'var(--text2)',
    lineHeight: 1.7,
  },
  cta: {
    textAlign: 'center',
    padding: '80px 40px',
    background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 100%)',
  },
  ctaTitle: {
    fontFamily: 'var(--serif)',
    fontSize: '28px',
    fontWeight: 400,
    color: 'var(--gold2)',
    marginBottom: '16px',
  },
  ctaText: {
    fontSize: '15px',
    color: 'var(--text2)',
    marginBottom: '28px',
  },
  ctaBtn: {
    display: 'inline-block',
    fontSize: '13px',
    letterSpacing: '0.1em',
    color: '#000',
    background: 'linear-gradient(135deg, #c9a84c 0%, #b89840 100%)',
    textDecoration: 'none',
    padding: '14px 32px',
    borderRadius: '6px',
    fontWeight: 600,
    boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
  },
  footer: {
    borderTop: '1px solid rgba(184,152,90,0.12)',
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  footerBrand: {
    fontFamily: 'var(--serif)',
    fontSize: '12px',
    letterSpacing: '0.15em',
    color: 'var(--gold)',
  },
  footerText: {
    fontSize: '11px',
    color: 'var(--text3)',
  },
}
