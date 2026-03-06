// src/app/api/upload/route.ts
//
// POST /api/upload?type=media|seal
// Accepts multipart/form-data with a single 'file' field.
// Uploads to Supabase Storage and returns the storage path.
// The client then PATCHes /api/capsules/:id with the path.

import { NextRequest, NextResponse } from 'next/server'
import { supabase, uploadCapsuleMedia, uploadSealArt } from '@/lib/supabase'

const MAX_AUDIO_BYTES = 15 * 1024 * 1024  // 15 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024  // 50 MB
const MAX_IMAGE_BYTES = 5  * 1024 * 1024  //  5 MB

const ALLOWED_AUDIO = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg']
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const uploadType = searchParams.get('type') // 'media' | 'seal'
  const capsuleId = searchParams.get('capsule_id')

  if (!uploadType || !['media', 'seal'].includes(uploadType)) {
    return NextResponse.json({ data: null, error: 'Invalid upload type' }, { status: 400 })
  }
  if (uploadType === 'media' && !capsuleId) {
    return NextResponse.json({ data: null, error: 'capsule_id required for media uploads' }, { status: 400 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) return NextResponse.json({ data: null, error: 'No file provided' }, { status: 400 })

  // ─── Validate file type & size ────────────────────────────────
  if (uploadType === 'media') {
    const isAudio = ALLOWED_AUDIO.includes(file.type)
    const isVideo = ALLOWED_VIDEO.includes(file.type)

    if (!isAudio && !isVideo) {
      return NextResponse.json({ data: null, error: 'Unsupported media type' }, { status: 400 })
    }
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_AUDIO_BYTES
    if (file.size > maxBytes) {
      const mb = Math.round(maxBytes / 1024 / 1024)
      return NextResponse.json({ data: null, error: `File too large (max ${mb} MB)` }, { status: 400 })
    }

    const { path, error } = await uploadCapsuleMedia(session.user.id, capsuleId!, file)
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })
    return NextResponse.json({ data: { path }, error: null })
  }

  if (uploadType === 'seal') {
    if (!ALLOWED_IMAGE.includes(file.type)) {
      return NextResponse.json({ data: null, error: 'Seal art must be an image (JPEG/PNG/WebP/GIF)' }, { status: 400 })
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ data: null, error: 'Image too large (max 5 MB)' }, { status: 400 })
    }

    const id = capsuleId || `seal_${Date.now()}`
    const { path, error } = await uploadSealArt(session.user.id, id, file)
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })
    return NextResponse.json({ data: { path }, error: null })
  }
}
