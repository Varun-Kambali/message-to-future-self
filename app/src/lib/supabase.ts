// src/lib/supabase.ts
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient }                             from '@supabase/supabase-js'
import { cookies }                                  from 'next/headers'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC  = process.env.SUPABASE_SERVICE_KEY!

// Browser (Client Components)
export function createBrowserSupabase() {
  return createBrowserClient(URL, ANON)
}

// Server (Server Components / Route Handlers)
export function createServerSupabase() {
  const store = cookies()
  return createServerClient(URL, ANON, {
    cookies: {
      getAll()       { return store.getAll() },
      setAll(list: any[])   {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)) }
        catch { /* called from Server Component; middleware handles refresh */ }
      },
    },
  })
}

// Admin — bypasses RLS; server-only
export const supabaseAdmin = createClient(URL, SVC, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export const BUCKET_MEDIA = 'capsule-media'
export const BUCKET_SEAL  = 'seal-art'
export const BUCKET_COVER = 'cover-images'

export async function signedUrl(bucket: string, path: string, exp = 3600) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, exp)
  if (error || !data) return null
  return data.signedUrl
}
