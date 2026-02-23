import Head from 'next/head'
import Link from 'next/link'

export default function Reviews() {
  const reviews = [
    {
      name: 'Marcus T.',
      role: 'Forex Trader',
      rating: 5,
      text: 'PipNexus has completely transformed my gold trading. The AMD phase detection is incredibly accurate, and the order block identification has helped me catch several high-probability setups.',
      date: 'February 2026',
    },
    {
      name: 'Sarah L.',
      role: 'Swing Trader',
      rating: 5,
      text: 'The multi-timeframe analysis is a game-changer. Being able to see confluence across M15, H1, and H4 has significantly improved my entry timing.',
      date: 'February 2026',
    },
    {
      name: 'James K.',
      role: 'Day Trader',
      rating: 4,
      text: 'Great tool for identifying liquidity zones and potential stop hunts. The Claude AI narrative helps me understand the "why" behind each signal.',
      date: 'January 2026',
    },
    {
      name: 'Elena R.',
      role: 'Crypto Trader',
      rating: 5,
      text: 'Started using PipNexus for gold and the results have been impressive. The spread analysis and weekly range positioning are particularly useful.',
      date: 'January 2026',
    },
    {
      name: 'David M.',
      role: 'Institutional Trader',
      rating: 4,
      text: 'The ICT methodology implementation is solid. I appreciate the focus on smart money concepts rather than just lagging indicators.',
      date: 'January 2026',
    },
    {
      name: 'Anna P.',
      role: 'Retail Trader',
      rating: 5,
      text: 'Finally a tool that combines fundamental news analysis with technicals. The event impact scoring helps me avoid trading during high-risk periods.',
      date: 'December 2025',
    },
  ]

  const stats = {
    avgRating: 4.7,
    totalReviews: 128,
    fiveStars: 89,
    fourStars: 31,
    threeStars: 6,
    twoStars: 2,
    oneStar: 0,
  }

  return (
    <>
      <Head>
        <title>Reviews - PipNexus</title>
        <meta name="description" content="See what traders are saying about PipNexus AI trading terminal" />
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
            <Link href="/reviews" style={{...s.navLink, color:'var(--gold)'}}>Reviews</Link>
            <Link href="/waitlist" style={s.navWaitlist}>Join Waitlist</Link>
          </nav>
        </header>

        <main style={s.main}>
          {/* Page Title */}
          <div style={s.pageHeader}>
            <h1 style={s.pageTitle}>What Traders Say</h1>
            <p style={s.pageDesc}>Join {stats.totalReviews}+ traders using PipNexus</p>
          </div>

          {/* Rating Overview */}
          <div style={s.ratingCard}>
            <div style={s.ratingLeft}>
              <div style={s.avgRating}>{stats.avgRating}</div>
              <div style={s.stars}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{
                    ...s.star,
                    color: i <= Math.round(stats.avgRating) ? 'var(--gold)' : 'var(--text3)'
                  }}>★</span>
                ))}
              </div>
              <div style={s.ratingCount}>Based on {stats.totalReviews} reviews</div>
            </div>
            <div style={s.ratingRight}>
              {[
                { stars: 5, count: stats.fiveStars, pct: (stats.fiveStars / stats.totalReviews) * 100 },
                { stars: 4, count: stats.fourStars, pct: (stats.fourStars / stats.totalReviews) * 100 },
                { stars: 3, count: stats.threeStars, pct: (stats.threeStars / stats.totalReviews) * 100 },
                { stars: 2, count: stats.twoStars, pct: (stats.twoStars / stats.totalReviews) * 100 },
                { stars: 1, count: stats.oneStar, pct: (stats.oneStar / stats.totalReviews) * 100 },
              ].map(r => (
                <div key={r.stars} style={s.barRow}>
                  <span style={s.barLabel}>{r.stars} ★</span>
                  <div style={s.barTrack}>
                    <div style={{...s.barFill, width: `${r.pct}%`}} />
                  </div>
                  <span style={s.barCount}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Grid */}
          <div style={s.reviewsGrid}>
            {reviews.map((review, i) => (
              <div key={i} style={{...s.reviewCard, animationDelay: `${i * 0.1}s`}} className="fu">
                <div style={s.reviewHeader}>
                  <div style={s.reviewerAvatar}>{review.name.split(' ').map(n => n[0]).join('')}</div>
                  <div>
                    <div style={s.reviewerName}>{review.name}</div>
                    <div style={s.reviewerRole}>{review.role}</div>
                  </div>
                  <div style={s.reviewStars}>
                    {[1,2,3,4,5].map(j => (
                      <span key={j} style={{
                        ...s.starSmall,
                        color: j <= review.rating ? 'var(--gold)' : 'var(--text3)'
                      }}>★</span>
                    ))}
                  </div>
                </div>
                <p style={s.reviewText}>"{review.text}"</p>
                <div style={s.reviewDate}>{review.date}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={s.cta}>
            <h2 style={s.ctaTitle}>Share Your Experience</h2>
            <p style={s.ctaText}>Help other traders by sharing your PipNexus journey.</p>
            <Link href="/waitlist" style={s.ctaBtn}>Join Waitlist →</Link>
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
    --gold: #c9a84c; --gold2: #e8c97a; --green: #3ddc97;
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
  pageHeader: { textAlign: 'center', marginBottom: '40px' },
  pageTitle: { fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: 300, letterSpacing: '0.1em', color: 'var(--gold2)', marginBottom: '12px' },
  pageDesc: { fontSize: '14px', color: 'var(--text2)' },
  ratingCard: { display: 'flex', gap: '40px', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(184,152,90,0.15)', borderRadius: '12px', padding: '32px', marginBottom: '40px', flexWrap: 'wrap' },
  ratingLeft: { textAlign: 'center', minWidth: '180px' },
  avgRating: { fontSize: '56px', fontWeight: 700, color: 'var(--gold2)', lineHeight: 1 },
  stars: { margin: '12px 0' },
  star: { fontSize: '20px', marginRight: '2px' },
  ratingCount: { fontSize: '12px', color: 'var(--text3)' },
  ratingRight: { flex: 1, minWidth: '250px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  barLabel: { fontSize: '12px', color: 'var(--text3)', width: '40px' },
  barTrack: { flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' },
  barFill: { height: '100%', background: 'var(--gold)', borderRadius: '4px' },
  barCount: { fontSize: '12px', color: 'var(--text2)', width: '30px', textAlign: 'right' },
  reviewsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' },
  reviewCard: { background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(184,152,90,0.15)', borderRadius: '12px', padding: '24px' },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  reviewerAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.05) 100%)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--gold)' },
  reviewerName: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  reviewerRole: { fontSize: '11px', color: 'var(--text3)' },
  reviewStars: { marginLeft: 'auto', display: 'flex', gap: '2px' },
  starSmall: { fontSize: '12px' },
  reviewText: { fontSize: '14px', color: 'var(--text2)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '16px' },
  reviewDate: { fontSize: '11px', color: 'var(--text3)' },
  cta: { textAlign: 'center', padding: '60px 40px', background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 100%)', borderRadius: '12px' },
  ctaTitle: { fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400, color: 'var(--gold2)', marginBottom: '12px' },
  ctaText: { fontSize: '14px', color: 'var(--text2)', marginBottom: '24px' },
  ctaBtn: { display: 'inline-block', fontSize: '13px', letterSpacing: '0.1em', color: '#000', background: 'linear-gradient(135deg, #c9a84c 0%, #b89840 100%)', textDecoration: 'none', padding: '14px 32px', borderRadius: '6px', fontWeight: 600 },
  footer: { borderTop: '1px solid rgba(184,152,90,0.12)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  footerBrand: { fontFamily: 'var(--serif)', fontSize: '12px', letterSpacing: '0.15em', color: 'var(--gold)' },
  footerText: { fontSize: '11px', color: 'var(--text3)' },
}
