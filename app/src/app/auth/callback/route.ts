import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { cookies }                   from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code     = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  if (code) {
    const store    = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll()     { return store.getAll() },
          setAll(list: any[]) { list.forEach(({ name, value, options }) => store.set(name, value, options)) },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${redirect}`)
}
