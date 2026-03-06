// src/app/api/profile/route.ts
// GET   /api/profile  — get current user's profile
// PATCH /api/profile  — update profile fields

import { NextRequest, NextResponse } from 'next/server'
import { supabase, uploadCoverImage } from '@/lib/supabase'
import type { UpdateProfilePayload } from '@/types'

export async function GET() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}

export async function PATCH(req: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const contentType = req.headers.get('content-type') || ''

  // Handle multipart form (cover image upload)
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('cover_image') as File | null

    if (!file) return NextResponse.json({ data: null, error: 'No file provided' }, { status: 400 })

    const { path, error: uploadError } = await uploadCoverImage(session.user.id, file)
    if (uploadError) return NextResponse.json({ data: null, error: uploadError }, { status: 500 })

    const { data, error } = await supabase
      .from('profiles')
      .update({ cover_image: path })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    return NextResponse.json({ data, error: null })
  }

  // Handle JSON (other profile fields)
  const body: UpdateProfilePayload = await req.json()
  const allowed: (keyof UpdateProfilePayload)[] = ['name', 'bio', 'cover_color', 'cover_title']
  const updates: Partial<UpdateProfilePayload> = {}

  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key] as any
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', session.user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}
