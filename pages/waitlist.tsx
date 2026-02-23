import { useState, FormEvent } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface FormData {
  name: string
  email: string
  interested: boolean
  comments: string
}

export default function Waitlist() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    interested: true,
    comments: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [successMessage, setSuccessMessage] = useState(
    'Thanks for joining! Check your email for a welcome message and next steps.'
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          interested: formData.interested,
          comments: formData.comments,
          source: 'website',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setReferralCode(data.referralCode || '')
        setSuccessMessage(
          data.message || 'Thanks for joining! Check your email for a welcome message and next steps.'
        )
        setSubmitted(true)
      } else {
        setError(data.message || 'Failed to join waitlist. Please try again.')
      }
    } catch {
      setError('Could not submit your information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    { icon: '⚡', title: 'Early Access', desc: 'Be first to access new features and beta testing opportunities' },
    { icon: '🎁', title: 'Priority Support', desc: 'Direct line to our development team for assistance' },
    { icon: '📊', title: 'Exclusive Insights', desc: 'Market analysis and trading strategies before public' },
    { icon: '🎯', title: 'Feature Requests', desc: 'Shape the future roadmap with your suggestions' },
  ]

  const features = [
    { icon: '🔐', title: 'Social Login', desc: 'Seamless onboarding with Facebook, Google, or Apple Sign-In' },
    { icon: '🔔', title: 'Smart Notifications', desc: 'Personalized alerts on market conditions and new features' },
    { icon: '🏆', title: 'Gamification', desc: 'Leaderboards, achievements, and rewards for active traders' },
    { icon: '⭐', title: 'Community Reviews', desc: 'Share and discover ratings from other traders' },
    { icon: '📚', title: 'Content Library', desc: 'Articles, videos, and expert insights on trading' },
    { icon: '💬', title: 'Push Notifications', desc: 'Real-time trading signals and market updates' },
    { icon: '👥', title: 'Referral Program', desc: 'Earn rewards and VIP status for inviting friends' },
    { icon: '📈', title: 'Performance Analytics', desc: 'Track your results with detailed statistics and tracking' },
  ]

  return (
    <>
      <Head>
        <title>Join Waitlist - PipNexus</title>
        <meta name="description" content="Join the PipNexus waitlist for early access to the AI-powered gold trading terminal" />
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
            <span style={s.logoMark} aria-hidden="true">⬡</span>
            <div>
              <div style={s.logoTitle}>PIPNEXUS</div>
              <div style={s.logoSub}>XAU/USD · ICT INTELLIGENCE</div>
            </div>
          </Link>
          <nav style={s.nav} aria-label="Primary">
            <Link href="/" style={s.navLink}>Terminal</Link>
            <Link href="/about" style={s.navLink}>About</Link>
            <Link href="/history" style={s.navLink}>History</Link>
            <Link href="/reviews" style={s.navLink}>Reviews</Link>
            <Link href="/waitlist" style={{...s.navLink, color:'var(--gold)'}}>Waitlist</Link>
          </nav>
        </header>

        <main style={s.main}>
          {/* Hero */}
          <div style={s.hero}>
            <div style={s.heroIcon} aria-hidden="true">⬡</div>
            <h1 style={s.heroTitle}>
              Join the <span style={s.gold}>PipNexus</span> Waitlist
            </h1>
            <p style={s.heroDesc}>
              Get early access to the most intelligent gold trading terminal.
              Be among the first to experience next-generation AI analysis.
            </p>
          </div>

          {/* Form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} style={s.formContainer}>
              <div style={s.formGrid}>
                {/* Name Field */}
                <div style={s.formField}>
                  <label htmlFor="waitlist-name" style={s.label}>Full Name</label>
                  <input
                    id="waitlist-name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    style={s.input}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Email Field */}
                <div style={s.formField}>
                  <label htmlFor="waitlist-email" style={s.label}>Email Address</label>
                  <input
                    id="waitlist-email"
                    type="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={s.input}
                    required
                    disabled={loading}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? 'waitlist-error' : undefined}
                  />
                </div>

                {/* Interest Checkbox */}
                <div style={{...s.formField, gridColumn: '1 / -1'}}>
                  <label style={s.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="interested"
                      checked={formData.interested}
                      onChange={handleChange}
                      disabled={loading}
                      style={s.checkbox}
                    />
                    <span>Yes, I'm interested in joining the waitlist and receiving updates</span>
                  </label>
                </div>

                {/* Comments Field */}
                <div style={{...s.formField, gridColumn: '1 / -1'}}>
                  <label htmlFor="waitlist-comments" style={s.label}>Questions or Comments (Optional)</label>
                  <textarea
                    id="waitlist-comments"
                    name="comments"
                    placeholder="Tell us what features you're most excited about or any questions you have..."
                    value={formData.comments}
                    onChange={handleChange}
                    style={{...s.input, minHeight: '100px', resize: 'vertical'}}
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <p id="waitlist-error" style={s.errorText} role="alert" aria-live="assertive">
                  {error}
                </p>
              )}

              <button type="submit" style={s.submitBtn} disabled={loading}>
                {loading ? (
                  <span style={s.spinner} />
                ) : (
                  'Join Waitlist →'
                )}
              </button>
            </form>
          ) : (
            <div style={s.successCard}>
              <div style={s.successIcon}>✓</div>
              <h2 style={s.successTitle}>You're on the list!</h2>
              <p style={s.successText}>
                {successMessage}
              </p>
              {referralCode && (
                <div style={s.referralBox}>
                  <p style={s.referralLabel}>Your Referral Code:</p>
                  <div style={s.referralCode}>{referralCode}</div>
                  <p style={s.referralHint}>Share this code with friends and earn rewards!</p>
                </div>
              )}
            </div>
          )}

          {/* Benefits */}
          <div style={s.sectionTitle}>Why Join the Waitlist?</div>
          <div style={s.benefitsGrid}>
            {benefits.map((benefit, i) => (
              <div key={i} style={{...s.benefitCard, animationDelay: `${i * 0.1}s`}} className="fu">
                <div style={s.benefitIcon}>{benefit.icon}</div>
                <h3 style={s.benefitTitle}>{benefit.title}</h3>
                <p style={s.benefitDesc}>{benefit.desc}</p>
              </div>
            ))}
          </div>

          {/* Features Coming to PipNexus */}
          <div style={s.featuresSection}>
            <h2 style={s.sectionTitle}>Powerful Features Coming Soon</h2>
            <p style={s.sectionDesc}>
              We're building the next-generation trading platform with game-changing capabilities
            </p>
            <div style={s.featureGrid}>
              {features.map((feature, i) => (
                <div key={i} style={{...s.featureCard, animationDelay: `${i * 0.08}s`}} className="fu">
                  <div style={s.featureIcon}>{feature.icon}</div>
                  <h3 style={s.featureTitle}>{feature.title}</h3>
                  <p style={s.featureDesc}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Program CTA */}
          <div style={s.referralSection}>
            <h2 style={s.referralTitle}>Earn Rewards Through Referrals</h2>
            <p style={s.referralText}>
              Invite your trading friends and earn exclusive bonuses, credits, and VIP status.
            </p>
            <div style={s.referralBenefits}>
              <div style={s.rewardTier}>
                <div style={s.tierNumber}>1+</div>
                <div style={s.tierName}>Bonus Credits</div>
                <div style={s.tierDesc}>$10 per friend</div>
              </div>
              <div style={s.rewardTier}>
                <div style={s.tierNumber}>5+</div>
                <div style={s.tierName}>Premium Features</div>
                <div style={s.tierDesc}>Unlock exclusive tools</div>
              </div>
              <div style={s.rewardTier}>
                <div style={s.tierNumber}>10+</div>
                <div style={s.tierName}>VIP Tier</div>
                <div style={s.tierDesc}>Lifetime 20% discount</div>
              </div>
              <div style={s.rewardTier}>
                <div style={s.tierNumber}>25+</div>
                <div style={s.tierName}>Ambassador</div>
                <div style={s.tierDesc}>Free premium forever</div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div style={s.proof}>
            <div style={s.proofTitle}>Join 500+ traders on the waitlist</div>
            <div style={s.proofAvatars}>
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter, i) => (
                <div key={i} style={{
                  ...s.proofAvatar,
                  marginLeft: i > 0 ? '-10px' : 0,
                  zIndex: 10 - i,
                }}>{letter}</div>
              ))}
            </div>
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
    --mono: 'JetBrains Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: var(--serif); font-size: 14px; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
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
  main: { padding: '60px 40px', maxWidth: '900px', margin: '0 auto' },
  hero: { textAlign: 'center', marginBottom: '48px' },
  heroIcon: { fontSize: '64px', color: 'var(--gold)', marginBottom: '24px', filter: 'drop-shadow(0 0 20px rgba(201,168,76,0.4))' },
  heroTitle: { fontFamily: 'var(--serif)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, letterSpacing: '0.08em', marginBottom: '16px' },
  gold: { color: 'var(--gold2)' },
  heroDesc: { fontSize: '16px', color: 'var(--text2)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 },
  formContainer: { maxWidth: '500px', margin: '0 auto 48px' },
  formGrid: { display: 'grid', gap: '18px', marginBottom: '24px' },
  formField: { textAlign: 'left' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', letterSpacing: '0.05em', color: 'var(--text2)', marginBottom: '8px' },
  input: { width: '100%', padding: '12px 14px', fontSize: '14px', fontFamily: 'var(--serif)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(184,152,90,0.25)', borderRadius: '6px', color: 'var(--text)', outline: 'none', transition: 'all 0.2s' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text)', cursor: 'pointer' },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--gold)' },
  submitBtn: { width: '100%', padding: '14px 28px', fontSize: '13px', fontWeight: '600', letterSpacing: '0.08em', color: '#000', background: 'linear-gradient(135deg, #c9a84c 0%, #b89840 100%)', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' },
  spinner: { width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  successCard: { background: 'linear-gradient(135deg, rgba(61,220,151,0.1) 0%, rgba(61,220,151,0.02) 100%)', border: '1px solid rgba(61,220,151,0.3)', borderRadius: '12px', padding: '40px', marginBottom: '48px', textAlign: 'center' },
  successIcon: { width: '56px', height: '56px', borderRadius: '50%', background: 'var(--green)', color: '#000', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  successTitle: { fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' },
  successText: { fontSize: '14px', color: 'var(--text2)', marginBottom: '20px' },
  referralBox: { background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', padding: '20px', marginTop: '20px' },
  referralLabel: { fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' },
  referralCode: { fontSize: '18px', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--gold2)', fontFamily: 'var(--mono)', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', textAlign: 'center' },
  referralHint: { fontSize: '12px', color: 'var(--text2)', marginTop: '8px' },
  errorText: { fontSize: '13px', color: '#ff6b6b', marginBottom: '24px', textAlign: 'center' },
  sectionTitle: { fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: '600', letterSpacing: '0.06em', color: 'var(--text)', marginBottom: '32px', textAlign: 'center' },
  sectionDesc: { fontSize: '15px', color: 'var(--text2)', textAlign: 'center', marginBottom: '32px', maxWidth: '600px', margin: '-16px auto 32px' },
  benefitsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '64px' },
  benefitCard: { background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(184,152,90,0.15)', borderRadius: '10px', padding: '24px', textAlign: 'center' },
  benefitIcon: { fontSize: '28px', marginBottom: '12px' },
  benefitTitle: { fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' },
  benefitDesc: { fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 },
  featuresSection: { marginBottom: '64px' },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  featureCard: { background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(184,152,90,0.2)', borderRadius: '12px', padding: '28px 24px', textAlign: 'center', transition: 'all 0.3s' },
  featureIcon: { fontSize: '36px', marginBottom: '16px', display: 'block' },
  featureTitle: { fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' },
  featureDesc: { fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 },
  referralSection: { background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.02) 100%)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '16px', padding: '48px 40px', textAlign: 'center', marginBottom: '64px' },
  referralTitle: { fontFamily: 'var(--serif)', fontSize: '28px', fontWeight: '600', color: 'var(--gold2)', marginBottom: '12px' },
  referralText: { fontSize: '15px', color: 'var(--text2)', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' },
  referralBenefits: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', maxWidth: '600px', margin: '0 auto' },
  rewardTier: { background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '20px 16px' },
  tierNumber: { fontSize: '28px', fontWeight: '700', color: 'var(--gold)', marginBottom: '6px' },
  tierName: { fontSize: '13px', fontWeight: '600', color: 'var(--text)' },
  tierDesc: { fontSize: '11px', color: 'var(--text2)', marginTop: '4px' },
  proof: { padding: '32px', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: '12px', textAlign: 'center', marginBottom: '40px' },
  proofTitle: { fontSize: '14px', color: 'var(--text2)', marginBottom: '16px' },
  proofAvatars: { display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  proofAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,168,76,0.3) 0%, rgba(201,168,76,0.1) 100%)', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--gold)' },
  footer: { borderTop: '1px solid rgba(184,152,90,0.12)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '40px' },
  footerBrand: { fontFamily: 'var(--serif)', fontSize: '12px', letterSpacing: '0.15em', color: 'var(--gold)' },
  footerText: { fontSize: '11px', color: 'var(--text3)' },
}
