-- ============================================================
-- Future Self Messenger — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────
-- Extends Supabase Auth users with extra metadata
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT,
  bio         TEXT,
  cover_color TEXT DEFAULT 'oxblood',
  cover_title TEXT DEFAULT 'Letters to the Future',
  cover_image TEXT,  -- Supabase Storage path
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CAPSULES ─────────────────────────────────────────────────
CREATE TABLE public.capsules (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('text', 'audio', 'video')),
  content      TEXT,           -- text content or note for audio/video
  media_path   TEXT,           -- Supabase Storage path for audio/video
  transcript   TEXT,           -- auto or manual transcript for audio
  prompt       TEXT,
  delivery_at  TIMESTAMPTZ NOT NULL,
  theme        TEXT DEFAULT 'oxblood',
  seal_color   TEXT DEFAULT '#8b1a1a',
  seal_emoji   TEXT DEFAULT '✦',
  seal_image   TEXT,           -- Storage path for custom seal artwork
  status       TEXT NOT NULL DEFAULT 'sealed' CHECK (status IN ('sealed', 'delivered', 'failed')),
  delivered_at TIMESTAMPTZ,
  email_sent   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index for the cron job — only looks at sealed capsules due for delivery
CREATE INDEX idx_capsules_delivery ON public.capsules(delivery_at, status)
  WHERE status = 'sealed';

-- Index for fetching a user's capsules
CREATE INDEX idx_capsules_user ON public.capsules(user_id, created_at DESC);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capsules ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/write their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Capsules: users can only access their own capsules
CREATE POLICY "Users can view own capsules"
  ON public.capsules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own capsules"
  ON public.capsules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own capsules"
  ON public.capsules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own capsules"
  ON public.capsules FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can update capsule status (for cron delivery)
-- This is handled by the API using SUPABASE_SERVICE_KEY, which bypasses RLS

-- ─── TRIGGERS ─────────────────────────────────────────────────
-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER capsules_updated_at
  BEFORE UPDATE ON public.capsules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── STORAGE BUCKETS ──────────────────────────────────────────
-- Run these in Supabase Storage or via the dashboard:
--
-- Bucket: capsule-media   (private, for audio/video)
-- Bucket: seal-art        (private, for custom seal images)
-- Bucket: cover-images    (private, for journal cover photos)
--
-- All buckets should have RLS. Media files are accessed
-- via signed URLs generated server-side.

-- ─── SAMPLE DATA (optional, for testing) ─────────────────────
-- INSERT INTO public.capsules (user_id, type, content, delivery_at, prompt)
-- VALUES (
--   '<your-user-uuid>',
--   'text',
--   'Dear future me, I am writing this on a quiet evening...',
--   NOW() + INTERVAL '1 year',
--   'What are you most afraid of right now?'
-- );
