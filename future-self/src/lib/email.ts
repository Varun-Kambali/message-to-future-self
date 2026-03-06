// src/lib/email.ts
// Uses Resend (free tier: 3,000 emails/month)
// Falls back gracefully if quota exceeded or key not set

import type { Capsule, Profile } from '@/types'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@futureself.app'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'

interface DeliveryEmailProps {
  profile: Profile
  capsule: Capsule
  signedUrl?: string
}

function buildEmailHtml({ profile, capsule, signedUrl }: DeliveryEmailProps): string {
  const firstName = profile.name?.split(' ')[0] || 'Friend'
  const deliveryDate = new Date(capsule.delivered_at || capsule.delivery_at)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const createdDate = new Date(capsule.created_at)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A letter from your past self</title>
</head>
<body style="margin:0;padding:0;background:#0d0804;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#f5efe0;border-radius:8px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="background:#6b1e1e;padding:40px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">✉</div>
      <h1 style="color:#c9a84c;font-size:22px;font-weight:400;font-style:italic;margin:0;letter-spacing:0.04em;">
        A letter from your past self
      </h1>
      <p style="color:rgba(201,168,76,0.6);font-size:12px;font-family:monospace;letter-spacing:0.1em;margin:12px 0 0;text-transform:uppercase;">
        Future Self Messenger
      </p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <p style="color:#5a4030;font-size:15px;line-height:1.7;margin:0 0 20px;font-style:italic;">
        Dear ${firstName},
      </p>
      <p style="color:#3a2e24;font-size:15px;line-height:1.7;margin:0 0 24px;">
        On <strong>${createdDate}</strong>, you sealed a time capsule addressed to your future self.
        That day has arrived.
      </p>

      ${capsule.prompt ? `
      <div style="border-left:3px solid #8b4a2a;padding:12px 20px;margin:0 0 24px;background:rgba(139,74,42,0.06);">
        <p style="color:#6a5040;font-size:13px;font-style:italic;margin:0;">"${capsule.prompt}"</p>
      </div>
      ` : ''}

      ${capsule.type === 'text' && capsule.content ? `
      <div style="background:#fffdf8;border:1px solid #e0d4c0;border-radius:6px;padding:28px;margin:0 0 28px;">
        <p style="color:#2a1e14;font-size:16px;line-height:1.9;font-style:italic;margin:0;white-space:pre-line;">${capsule.content}</p>
      </div>
      ` : ''}

      ${(capsule.type === 'audio' || capsule.type === 'video') ? `
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${APP_URL}/journal?capsule=${capsule.id}" 
           style="display:inline-block;background:#8b4a2a;color:rgba(255,220,150,0.95);padding:14px 32px;border-radius:2px;text-decoration:none;font-family:monospace;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">
          ${capsule.type === 'audio' ? '🎙 Play Voice Note' : '📹 Watch Video'} →
        </a>
      </div>
      ` : ''}

      <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e0d4c0;">
        <a href="${APP_URL}/journal" 
           style="display:inline-block;background:transparent;color:#8b4a2a;padding:12px 28px;border:1px solid #8b4a2a;border-radius:2px;text-decoration:none;font-family:monospace;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">
          Open Your Journal →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;background:#f0e8d8;text-align:center;">
      <p style="color:#a09080;font-size:11px;font-family:monospace;letter-spacing:0.08em;margin:0;">
        FUTURE SELF MESSENGER · Inspired by a quiet café in Tokyo
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function sendDeliveryEmail(
  props: DeliveryEmailProps
): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email delivery')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: props.profile.email,
        subject: `📬 A letter from your past self has arrived`,
        html: buildEmailHtml(props),
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      console.error('[email] Resend error:', body)
      return { success: false, error: body.message || 'Send failed' }
    }

    return { success: true }
  } catch (err) {
    console.error('[email] Unexpected error:', err)
    return { success: false, error: String(err) }
  }
}
