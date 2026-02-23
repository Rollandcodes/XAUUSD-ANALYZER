import Head from 'next/head'
import Link from 'next/link'

export default function Blog() {
  const posts = [
    {
      slug: 'understanding-amd-phases',
      title: 'Understanding AMD Phases in Gold Trading',
      excerpt: 'Learn how Accumulation, Manipulation, and Distribution phases work and how to identify them in price action.',
      date: 'February 20, 2026',
      category: 'Trading Strategy',
      readTime: '5 min',
    },
    {
      slug: 'order-blocks-guide',
      title: 'A Complete Guide to Order Blocks',
      excerpt: 'Order blocks are zones where institutional traders placed large orders. Here\'s how to identify and trade them.',
      date: 'February 15, 2026',
      category: 'ICT Concepts',
      readTime: '7 min',
    },
    {
      slug: 'fair-value-gaps',
      title: 'Trading Fair Value Gaps (FVGs)',
      excerpt: 'Fair Value Gaps represent areas of imbalance. Learn how to find and trade these high-probability setups.',
      date: 'February 10, 2026',
      category: 'Technical Analysis',
      readTime: '6 min',
    },
    {
      slug: 'multi-timeframe-analysis',
      title: 'Multi-Timeframe Analysis for Gold',
      excerpt: 'Why analyzing multiple timeframes can dramatically improve your trade entries and win rate.',
      date: 'February 5, 2026',
      category: 'Trading Tips',
      readTime: '8 min',
    },
    {
      slug: 'risk-management',
      title: 'Essential Risk Management Rules',
      excerpt: 'Protect your capital with these essential risk management principles every trader should follow.',
      date: 'January 28, 2026',
      category: 'Trading Basics',
      readTime: '5 min',
    },
    {
      slug: 'gold-fundamentals',
      title: 'Gold Fundamentals: What Moves XAU/USD',
      excerpt: 'Understand the key economic factors that drive gold prices and how to factor them into your analysis.',
      date: 'January 20, 2026',
      category: 'Fundamentals',
      readTime: '10 min',
    },
  ]

  return (
    <>
      <Head>
        <title>Blog - PipNexus</title>
        <meta name="description" content="Trading insights, strategies, and educational content from PipNexus" />
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
            <h1 style={s.pageTitle}>Blog</h1>
            <p style={s.pageDesc}>Trading insights, strategies, and educational content</p>
          </div>

          {/* Posts Grid */}
          <div style={s.postsGrid}>
            {posts.map((post, i) => (
              <article key={i} style={{...s.postCard, animationDelay: `${i * 0.1}s`}} className="fu">
                <div style={s.postMeta}>
                  <span style={s.postCategory}>{post.category}</span>
                  <span style={s.postDate}>{post.date}</span>
                </div>
                <h2 style={s.postTitle}>{post.title}</h2>
                <p style={s.postExcerpt}>{post.excerpt}</p>
                <div style={s.postFooter}>
                  <span style={s.readTime}>{post.readTime} read</span>
                  <span style={s.readMore}>Read more →</span>
                </div>
              </article>
            ))}
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
    --bg: #06070a; --text: #eae8e0; --text2: #c5c2b8; --text3: #9a9280;
    --gold: #c9a84c; --gold2: #e8c97a;
    --serif: 'Bricolage Grotesque', 'Inter', -apple-system, sans-serif;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: var(--serif); font-size: 14px; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
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
  main: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  pageHeader: { textAlign: 'center', marginBottom: '48px' },
  pageTitle: { fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 300, letterSpacing: '0.1em', color: 'var(--gold2)', marginBottom: '12px' },
  pageDesc: { fontSize: '14px', color: 'var(--text2)' },
  postsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  postCard: { background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(184,152,90,0.15)', borderRadius: '12px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s' },
  postMeta: { display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' },
  postCategory: { fontSize: '10px', letterSpacing: '0.1em', color: 'var(--gold)', background: 'rgba(201,168,76,0.1)', padding: '4px 8px', borderRadius: '4px' },
  postDate: { fontSize: '11px', color: 'var(--text3)' },
  postTitle: { fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 500, color: 'var(--text)', marginBottom: '12px', lineHeight: 1.4 },
  postExcerpt: { fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '16px' },
  postFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  readTime: { fontSize: '11px', color: 'var(--text3)' },
  readMore: { fontSize: '12px', color: 'var(--gold)', fontWeight: 500 },
  footer: { borderTop: '1px solid rgba(184,152,90,0.12)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  footerBrand: { fontFamily: 'var(--serif)', fontSize: '12px', letterSpacing: '0.15em', color: 'var(--gold)' },
  footerText: { fontSize: '11px', color: 'var(--text3)' },
}
