// src/lib/supabase.ts
// Two clients: browser (anon key) and server (service key for cron)

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// ─── Browser client (respects RLS, uses anon key) ──────────────
// Use this in Client Components and for user-facing operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// ─── Server/admin client (bypasses RLS, for cron jobs) ─────────
// NEVER expose this to the browser
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Auth helpers ──────────────────────────────────────────────

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')
  return session
}

// ─── Storage helpers ───────────────────────────────────────────

const MEDIA_BUCKET = 'capsule-media'
const SEAL_BUCKET = 'seal-art'
const COVER_BUCKET = 'cover-images'

export async function uploadCapsuleMedia(
  userId: string,
  capsuleId: string,
  file: File
): Promise<{ path: string; error: string | null }> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${capsuleId}/media.${ext}`

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: true })

  if (error) return { path: '', error: error.message }
  return { path, error: null }
}

export async function uploadSealArt(
  userId: string,
  capsuleId: string,
  file: File
): Promise<{ path: string; error: string | null }> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${capsuleId}/seal.${ext}`

  const { error } = await supabase.storage
    .from(SEAL_BUCKET)
    .upload(path, file, { upsert: true })

  if (error) return { path: '', error: error.message }
  return { path, error: null }
}

export async function uploadCoverImage(
  userId: string,
  file: File
): Promise<{ path: string; error: string | null }> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/cover.${ext}`

  const { error } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, file, { upsert: true })

  if (error) return { path: '', error: error.message }
  return { path, error: null }
}

// Generate a signed URL valid for 1 hour (used at delivery time)
export async function getSignedMediaUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error || !data) return null
  return data.signedUrl
}

export { MEDIA_BUCKET, SEAL_BUCKET, COVER_BUCKET }
