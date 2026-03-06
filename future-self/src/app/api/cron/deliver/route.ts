// src/app/api/cron/deliver/route.ts
//
// Called by Vercel Cron on a schedule (see vercel.json)
// Finds all capsules due for delivery, marks them delivered,
// generates signed URLs, and optionally sends email.
//
// SECURITY: protected by CRON_SECRET env var.
// Vercel automatically sets Authorization: Bearer <token> on cron calls.

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getSignedMediaUrl, MEDIA_BUCKET, SEAL_BUCKET } from '@/lib/supabase'
import { sendDeliveryEmail } from '@/lib/email'
import type { Capsule, Profile } from '@/types'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  // ─── Auth check ──────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()
  console.log(`[cron/deliver] Running at ${now}`)

  // ─── Find due capsules ────────────────────────────────────────
  const { data: dueCapsules, error: fetchError } = await supabaseAdmin
    .from('capsules')
    .select('*')
    .eq('status', 'sealed')
    .lte('delivery_at', now)
    .limit(50) // process in batches to stay within timeout

  if (fetchError) {
    console.error('[cron/deliver] Fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!dueCapsules || dueCapsules.length === 0) {
    console.log('[cron/deliver] No capsules due.')
    return NextResponse.json({ data: { processed: 0 }, error: null })
  }

  console.log(`[cron/deliver] Found ${dueCapsules.length} capsule(s) to deliver`)

  const results = { delivered: 0, failed: 0, emails_sent: 0 }

  for (const capsule of dueCapsules as Capsule[]) {
    try {
      // ─── Mark as delivered ──────────────────────────────────
      const { error: updateError } = await supabaseAdmin
        .from('capsules')
        .update({
          status: 'delivered',
          delivered_at: now,
        })
        .eq('id', capsule.id)
        .eq('status', 'sealed') // prevent double-delivery race condition

      if (updateError) {
        console.error(`[cron/deliver] Update failed for ${capsule.id}:`, updateError)
        results.failed++
        continue
      }

      results.delivered++

      // ─── Send email (best-effort) ───────────────────────────
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', capsule.user_id)
        .single()

      if (profile) {
        // Generate signed URL for media capsules
        let signedUrl: string | undefined
        if (capsule.media_path) {
          signedUrl = await getSignedMediaUrl(MEDIA_BUCKET, capsule.media_path) ?? undefined
        }

        const { success } = await sendDeliveryEmail({
          profile: profile as Profile,
          capsule,
          signedUrl,
        })

        if (success) {
          results.emails_sent++
          await supabaseAdmin
            .from('capsules')
            .update({ email_sent: true })
            .eq('id', capsule.id)
        }
      }
    } catch (err) {
      console.error(`[cron/deliver] Unexpected error for capsule ${capsule.id}:`, err)

      // Mark as failed so we can retry or investigate
      await supabaseAdmin
        .from('capsules')
        .update({ status: 'failed' })
        .eq('id', capsule.id)

      results.failed++
    }
  }

  console.log('[cron/deliver] Done:', results)
  return NextResponse.json({ data: results, error: null })
}
