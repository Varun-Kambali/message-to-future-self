import { NextRequest, NextResponse }  from 'next/server'
import { createServerSupabase }       from '@/lib/supabase-server'
import type { CreateCapsulePayload }  from '@/types'

// GET /api/capsules — list the current user's capsules
export async function GET(req: NextRequest) {
  const sb = createServerSupabase()
  const { data: { session } } = await sb.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = new URL(req.url).searchParams.get('status')
  let q = sb.from('capsules').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/capsules — create a new capsule
export async function POST(req: NextRequest) {
  const sb = createServerSupabase()
  const { data: { session } } = await sb.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: CreateCapsulePayload
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.type || !['text','audio','video'].includes(body.type))
    return NextResponse.json({ error: 'type must be text|audio|video' }, { status: 400 })

  if (!body.delivery_at)
    return NextResponse.json({ error: 'delivery_at required' }, { status: 400 })

  const deliveryAt = new Date(body.delivery_at)
  const minDate    = new Date(Date.now() + 1 * 86400000) // 1 day
  const maxDate    = new Date(Date.now() + 10 * 365.25 * 86400000)
  if (deliveryAt < minDate) return NextResponse.json({ error: 'Minimum delivery is 1 day from now' }, { status: 400 })
  if (deliveryAt > maxDate) return NextResponse.json({ error: 'Maximum delivery is 10 years from now' }, { status: 400 })

  const { data, error } = await sb.from('capsules').insert({
    user_id:     session.user.id,
    type:        body.type,
    content:     body.content     || null,
    transcript:  body.transcript  || null,
    prompt:      body.prompt      || null,
    delivery_at: deliveryAt.toISOString(),
    seal_color:  body.seal_color  || '#a02020',
    seal_emoji:  body.seal_emoji  || '✦',
    status:      'sealed',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
