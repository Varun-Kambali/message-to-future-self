// src/app/api/capsules/route.ts
// GET  /api/capsules        — list the current user's capsules
// POST /api/capsules        — create a new capsule

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { CreateCapsulePayload } from '@/types'

// ─── GET: list capsules ────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { data: { session }, error: authError } = await supabase.auth.getSession()

  if (authError || !session) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // 'sealed' | 'delivered' | null (all)

  let query = supabase
    .from('capsules')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

// ─── POST: create capsule ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const { data: { session }, error: authError } = await supabase.auth.getSession()

  if (authError || !session) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  let body: CreateCapsulePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate
  if (!body.type || !['text', 'audio', 'video'].includes(body.type)) {
    return NextResponse.json({ data: null, error: 'Invalid capsule type' }, { status: 400 })
  }
  if (!body.delivery_at) {
    return NextResponse.json({ data: null, error: 'delivery_at is required' }, { status: 400 })
  }

  const deliveryDate = new Date(body.delivery_at)
  const minDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month minimum
  const maxDate = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 year max

  if (deliveryDate < minDate) {
    return NextResponse.json({ data: null, error: 'Delivery date must be at least 1 month in the future' }, { status: 400 })
  }
  if (deliveryDate > maxDate) {
    return NextResponse.json({ data: null, error: 'Delivery date cannot exceed 10 years' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('capsules')
    .insert({
      user_id: session.user.id,
      type: body.type,
      content: body.content || null,
      transcript: body.transcript || null,
      prompt: body.prompt || null,
      delivery_at: body.delivery_at,
      theme: body.theme || 'oxblood',
      seal_color: body.seal_color || '#8b1a1a',
      seal_emoji: body.seal_emoji || '✦',
      status: 'sealed',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
