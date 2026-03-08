# Future Self

*Write a letter. Seal it with wax. Let your future self find it.*
Inspired by a quiet café in Tokyo where visitors write letters to themselves, seal them, and receive them a year later — Future Self Messenger is a digital time capsule journal. Capture a moment in text, voice, or video, choose your delivery date, press your wax seal, and forget about it. On the day it's due, it arrives back to you like a gift from the past.

---

## Demo

<p align="center">
  <img src="app/media/working.gif" alt="Future Self Demo Flow" width="900"/>
</p>

<p align="center">
  <em>
  Choose a prompt → write a letter → set delivery in 3 years → craft a wax seal → seal the capsule for the future
  </em>
</p>

---

# The Ritual

Sit at a quiet desk.
You write something honest — a letter, a voice note, a video — addressed to the person you'll be in one, two, or five years. You choose a wax colour, pick a symbol, pour the seal. The capsule locks. You can see it sitting there in your journal, sealed, but you cannot open it. On the delivery date, the app unlocks it, sends you an email, and your past self's words are waiting.
The whole thing runs on free infrastructure. No subscription, no credit card, no expiry.

---

# Core Features

- **Three capsule types** — written letter, voice recording, or video
- **Wax seal studio** — 8 wax colours, 12 symbols, upload your own artwork to etch into the seal
- **Reflection prompts** — 8 handwritten prompts to spark honest writing
- **Leather journal** — 5 cover colours, custom title, animated 3D book on your dashboard
- **Scheduled delivery** — choose 1 month to 5 years; Vercel cron checks hourly
- **Delivery email** — beautiful HTML letter sent via Resend on delivery day
- **Sealed = locked** — capsules are genuinely unreadable until the date arrives
- **Audio player** — waveform visualizer with live word-by-word transcript highlighting
- **Page-flip journal** — two-page book spread with CSS 3D flip animation
- **Google + email auth** — via Supabase Auth
- **Fully free** — Supabase free tier + Vercel Hobby + Resend free tier

---

# Screenshots

### Landing Page

<p align="center">
  <img src="app/media/image1.png" alt="Landing page with floating journal" width="900"/>
</p>

---

### Journal Writing Experience

<p align="center">
  <img src="app/media/image2.png" alt="Open journal writing experience" width="900"/>
</p>

---

### Wax Seal Studio

<p align="center">
  <img src="app/media/image3.png" alt="Wax seal creation studio" width="900"/>
</p>

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 14 App Router, TypeScript |
| Database + Auth | Supabase (Postgres + Row Level Security) |
| File storage | Supabase Storage (private buckets, signed URLs) |
| Email | Resend (3,000 free emails/month) |
| Hosting | Vercel Hobby (free, auto-deploys from GitHub) |
| Scheduled delivery | Vercel Cron Jobs (hourly) |


---

## Running locally

### Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project
- A free [Resend](https://resend.com) account (optional — app works without email)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/future-self-messenger.git
cd future-self-messenger/app
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
   - This creates the `profiles` and `capsules` tables, RLS policies, storage buckets, and a trigger that auto-creates a profile when someone signs up
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon` / public key
   - `service_role` key

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000

RESEND_API_KEY=re_xxxxxxxxxxxx        # optional
FROM_EMAIL=noreply@yourdomain.com     # optional

CRON_SECRET=any-long-random-string    # generate: openssl rand -hex 32
```

> **Important:** Do not add inline comments on the same line as values — Next.js will include them as part of the value.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
├── supabase/
│   └── schema.sql              # Run once in Supabase SQL Editor
├── src/
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── login/              # Email + Google sign-in
│   │   ├── signup/             # Account creation
│   │   ├── dashboard/          # Floating journal book + capsule list
│   │   ├── new-entry/          # 3-step capsule creation flow
│   │   ├── journal/            # Two-page book spread reader
│   │   ├── settings/           # Cover customisation + profile
│   │   ├── auth/callback/      # OAuth redirect handler
│   │   └── api/
│   │       ├── capsules/       # GET list, POST create
│   │       ├── capsules/[id]/  # GET, PATCH, DELETE single capsule
│   │       ├── upload/         # Media + seal art file uploads
│   │       ├── profile/        # GET + PATCH profile
│   │       └── cron/deliver/   # Hourly delivery job
│   ├── components/
│   │   └── WaxSeal.tsx         # Canvas-rendered wax seal
│   ├── lib/
│   │   ├── supabase-browser.ts # Client-side Supabase (use client)
│   │   ├── supabase-server.ts  # Server-side Supabase + admin client
│   │   └── email.ts            # Resend delivery email
│   ├── types/
│   │   └── index.ts            # Shared TypeScript types
│   └── middleware.ts           # Auth-guarded route protection
├── vercel.json                 # Hourly cron schedule
└── .env.example                # Environment variable template
```

---

## Deploying to Vercel

1. Push to GitHub (already done)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Add all environment variables from `.env.example` in the Vercel dashboard
   - Change `NEXT_PUBLIC_APP_URL` to your Vercel URL
4. Deploy

Then in Supabase → **Authentication → URL Configuration**:
- Set **Site URL** to `https://your-app.vercel.app`
- Add `https://your-app.vercel.app/auth/callback` to **Redirect URLs**

The cron job in `vercel.json` will run automatically every hour and deliver any due capsules.

To test delivery manually:
```bash
# Force a capsule to be due (run in Supabase SQL Editor)
UPDATE capsules SET delivery_at = NOW() - interval '1 minute' WHERE status = 'sealed' LIMIT 1;

# Trigger the cron endpoint
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-app.vercel.app/api/cron/deliver
```

---

## Database schema

Two tables, both with Row Level Security — users can only ever read or write their own rows.

**`profiles`** — extends Supabase Auth users with journal customisation fields (cover colour, cover title, name, bio).

**`capsules`** — one row per time capsule. Key fields:

| Column | Description |
|---|---|
| `type` | `text`, `audio`, or `video` |
| `content` | Written text (text capsules) |
| `media_path` | Storage path in `capsule-media` bucket |
| `delivery_at` | When to unlock (1 month – 10 years) |
| `seal_color` | Hex colour of the wax seal |
| `seal_emoji` | Symbol etched into the seal |
| `status` | `sealed` → `delivered` → (or `failed` on cron error) |
| `email_sent` | Whether the delivery email was sent |

Media is stored in private Supabase Storage buckets. Signed URLs (1-hour expiry) are generated at read time, only for delivered capsules.

---

## Free tier limits

| Service | Limit | Notes |
|---|---|---|
| Supabase DB | 500 MB | Thousands of capsules |
| Supabase Storage | 1 GB | ~200 audio clips or ~50 short videos |
| Supabase Auth | 50,000 MAU | More than enough |
| Vercel Hobby | 100 GB bandwidth/month | Very generous |
| Vercel Cron | Hourly | Delivery accuracy: ±1 hour |
| Resend | 3,000 emails/month | Falls back to in-app only if exceeded |

---

## Inspiration

This project began with a video about a café in Tokyo that offers a peculiar ritual: you write a letter to yourself, seal it with wax, and drop it into their mailbox. They post it back to you exactly one year later. There's something profound about the delay — the forced perspective, the surprise of meeting your past self's handwriting, the realisation of how much (or how little) has changed.

This app is an attempt to carry that ritual into everyday life.

---