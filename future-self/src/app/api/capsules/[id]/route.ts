// src/app/api/capsules/[id]/route.ts
// GET    /api/capsules/:id  — get a single capsule (adds signed URLs for delivered ones)
// PATCH  /api/capsules/:id  — update seal art / media path after upload
// DELETE /api/capsules/:id  — delete a sealed capsule

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin, getSignedMediaUrl, MEDIA_BUCKET, SEAL_BUCKET } from '@/lib/supabase'

interface RouteContext {
  params: { id: string }
}

// ─── GET: single capsule ───────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: capsule, error } = await supabase
    .from('capsules')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (error || !capsule) {
    return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
  }

  // For delivered capsules: generate signed URLs for media
  let media_url: string | null = null
  let seal_image_url: string | null = null

  if (capsule.status === 'delivered') {
    if (capsule.media_path) {
      media_url = await getSignedMediaUrl(MEDIA_BUCKET, capsule.media_path)
    }
    if (capsule.seal_image) {
      seal_image_url = await getSignedMediaUrl(SEAL_BUCKET, capsule.seal_image)
    }
  }

  return NextResponse.json({
    data: { ...capsule, media_url, seal_image_url },
    error: null,
  })
}

// ─── PATCH: update paths after file upload ─────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['media_path', 'seal_image', 'transcript', 'content'] as const
  const updates: Record<string, string> = {}

  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ data: null, error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('capsules')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .eq('status', 'sealed') // cannot update delivered capsules
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}

// ─── DELETE: remove sealed capsule ────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  // Fetch first to get storage paths for cleanup
  const { data: capsule } = await supabase
    .from('capsules')
    .select('media_path, seal_image, status')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (!capsule) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })
  if (capsule.status === 'delivered') {
    return NextResponse.json({ data: null, error: 'Cannot delete a delivered capsule' }, { status: 403 })
  }

  // Delete from storage
  const filesToDelete: { bucket: string; path: string }[] = []
  if (capsule.media_path) filesToDelete.push({ bucket: MEDIA_BUCKET, path: capsule.media_path })
  if (capsule.seal_image) filesToDelete.push({ bucket: SEAL_BUCKET, path: capsule.seal_image })

  for (const f of filesToDelete) {
    await supabaseAdmin.storage.from(f.bucket).remove([f.path])
  }

  // Delete row
  const { error } = await supabase
    .from('capsules')
    .delete()
    .eq('id', params.id)
    .eq('user_id', session.user.id)

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data: { deleted: true }, error: null })
}
