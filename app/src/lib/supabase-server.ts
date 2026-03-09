// src/lib/supabase-server.ts
// Only import this in Server Components, Route Handlers, or middleware
// Never import in 'use client' files
import { createServerClient } from '@supabase/ssr'
import { createClient }       from '@supabase/supabase-js'
import { cookies }            from 'next/headers'

export function createServerSupabase() {
  const store = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()     { return store.getAll() },
        setAll(list: any[]) {
          try { list.forEach(({ name, value, options }) => store.set(name, value, options)) }
          catch { /* called from Server Component; middleware handles refresh */ }
        },
      },
    }
  )
}

// Admin client — service role, bypasses RLS. Server-only.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export const BUCKET_MEDIA = 'capsule-media'
export const BUCKET_SEAL  = 'seal-art'
export const BUCKET_COVER = 'cover-images'

export async function signedUrl(bucket: string, path: string, exp = 3600) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, exp)
  if (error || !data) return null
  return data.signedUrl
}
