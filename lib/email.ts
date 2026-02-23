// Email service for waitlist confirmations and notifications

interface EmailParams {
  name: string
  email: string
  appName?: string
}

/**
 * Generate welcome email template
 */
export function generateWelcomeEmail(params: EmailParams): { subject: string; html: string } {
  const { name, email, appName = 'PipNexus' } = params

  const subject = `You're now on the ${appName} waitlist! 🚀`

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #050609 0%, #0a0b0e 100%); border-radius: 10px; }
      .header { text-align: center; color: #c9a84c; font-size: 24px; margin-bottom: 20px; font-weight: bold; }
      .content { background: rgba(255, 255, 255, 0.95); border-radius: 8px; padding: 30px; }
      .greeting { font-size: 18px; color: #222; margin-bottom: 15px; }
      .section { margin: 20px 0; }
      .section h3 { color: #c9a84c; font-size: 16px; margin-bottom: 10px; }
      .section p { color: #555; margin: 8px 0; }
      .benefits { background: #f8f8f8; border-left: 4px solid #c9a84c; padding: 15px; border-radius: 4px; margin: 15px 0; }
      .benefits li { margin: 8px 0; color: #333; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #c9a84c, #b89840); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 15px 0; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
      .highlight { color: #c9a84c; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">⬡ ${appName}</div>
      
      <div class="content">
        <div class="greeting">Hello <span class="highlight">${name}</span>,</div>
        
        <p>Thank you for expressing interest in <span class="highlight">${appName}</span>! We're thrilled to have you join our growing community of traders.</p>
        
        <div class="section">
          <h3>What's Next?</h3>
          <p>You're now on our exclusive waitlist and will be among the first to access:</p>
          <div class="benefits">
            <ul>
              <li>✓ Early access to the intelligent trading terminal</li>
              <li>✓ Beta testing opportunities with exclusive features</li>
              <li>✓ Priority support from our development team</li>
              <li>✓ Exclusive market insights before public release</li>
              <li>✓ Special launch-day bonuses and discounts</li>
            </ul>
          </div>
        </div>
        
        <div class="section">
          <h3>Earn Rewards with Our Referral Program</h3>
          <p>Know other traders who'd love ${appName}? Share your unique referral link and earn:</p>
          <div class="benefits">
            <ul>
              <li>🎁 Bonus credits for each successful referral</li>
              <li>📈 Exclusive features unlocked at 5+ referrals</li>
              <li>👑 VIP tier status at 10+ referrals</li>
              <li>💰 Lifetime discount on premium features</li>
            </ul>
          </div>
          <p><em>Your referral link will be available once early access launches.</em></p>
        </div>
        
        <div class="section">
          <h3>Stay Updated</h3>
          <p>We'll send you occasional updates about:</p>
          <div class="benefits">
            <ul>
              <li>🚀 Major feature announcements</li>
              <li>📊 Market analysis insights</li>
              <li>💡 Trading tips from industry experts</li>
              <li>⏰ Launch date and beta access information</li>
            </ul>
          </div>
        </div>
        
        <div class="section">
          <h3>Questions or Feedback?</h3>
          <p>We'd love to hear from you! Reply to this email with any questions, suggestions, or if you'd like to participate in our beta testing program.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://pipnexus.com" class="cta-button">Visit PipNexus</a>
        </div>
        
        <p style="color: #888; font-size: 13px; margin-top: 25px;">
          <em>Educational purposes only. This is not financial advice. Always conduct your own research and consult with a financial advisor before trading.</em>
        </p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
        <p>You received this email because you joined our waitlist at ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
  </body>
</html>
  `

  return { subject, html }
}

/**
 * Send waitlist email using Resend API.
 * Falls back to logging when RESEND_API_KEY is not configured.
 */
export async function sendWaitlistEmail(params: EmailParams): Promise<boolean> {
  try {
    const { subject, html } = generateWelcomeEmail(params)
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    if (!resendApiKey) {
      console.warn('[EMAIL] RESEND_API_KEY is not set. Skipping real send and logging only.')
      console.log(`[EMAIL] To: ${params.email}`)
      console.log(`[EMAIL] Subject: ${subject}`)
      return true
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.email],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[EMAIL] Resend API error ${response.status}: ${errorText}`)
      return false
    }

    console.log(`[EMAIL] Sent via Resend to ${params.email}`)

    return true
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error)
    return false
  }
}
