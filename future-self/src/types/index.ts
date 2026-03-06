// ─── Database Types ────────────────────────────────────────────

export type CapsuleType = 'text' | 'audio' | 'video'
export type CapsuleStatus = 'sealed' | 'delivered' | 'failed'

export interface Profile {
  id: string
  email: string
  name: string | null
  bio: string | null
  cover_color: string
  cover_title: string
  cover_image: string | null
  created_at: string
  updated_at: string
}

export interface Capsule {
  id: string
  user_id: string
  type: CapsuleType
  content: string | null
  media_path: string | null
  transcript: string | null
  prompt: string | null
  delivery_at: string
  theme: string
  seal_color: string
  seal_emoji: string
  seal_image: string | null
  status: CapsuleStatus
  delivered_at: string | null
  email_sent: boolean
  created_at: string
  updated_at: string
}

// ─── API Payloads ──────────────────────────────────────────────

export interface CreateCapsulePayload {
  type: CapsuleType
  content?: string
  transcript?: string
  prompt?: string
  delivery_at: string       // ISO date string
  theme?: string
  seal_color?: string
  seal_emoji?: string
  // media_path and seal_image are set after upload
}

export interface UpdateProfilePayload {
  name?: string
  bio?: string
  cover_color?: string
  cover_title?: string
}

// ─── API Responses ─────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Signed media URL (returned when capsule is delivered) ─────

export interface DeliveredCapsule extends Capsule {
  media_url?: string   // signed URL, valid for 1 hour
  seal_image_url?: string
}
