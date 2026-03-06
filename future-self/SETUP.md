# Future Self Messenger — Setup & Deployment Guide

> A digital time capsule app where users send letters, voice notes, and videos to their future selves.  
> **100% free-tier stack**: Next.js + Supabase + Vercel + Resend

---

## Stack Overview

| Layer | Technology | Free Tier |
|-------|-----------|-----------|
| Frontend + Backend | Next.js 14 App Router + TypeScript | — |
| Hosting + Cron | Vercel Hobby | Free forever |
| Database + Auth | Supabase | 500 MB DB, 50k MAUs |
| File Storage | Supabase Storage | 1 GB |
| Email | Resend | 3,000 emails/month |

---

## 1. Prerequisites

- Node.js 18+
- A GitHub account
- A Supabase account → https://supabase.com
- A Vercel account → https://vercel.com
- A Resend account (optional, for email delivery) → https://resend.com

---

## 2. Supabase Setup

### 2a. Create a project
1. Go to https://supabase.com → New project
2. Choose a name (e.g. `future-self`) and a strong password
3. Select your region (closest to your users)

### 2b. Run the schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Paste the full contents of `supabase/schema.sql`
3. Click **Run**

### 2c. Create Storage Buckets
Go to **Storage** in the dashboard and create three **private** buckets:

| Bucket name | Purpose |
|-------------|---------|
| `capsule-media` | Audio and video files |
| `seal-art` | Custom wax seal artwork |
| `cover-images` | Journal cover photos |

For each bucket:
- Set **Public** to **OFF** (all media is accessed via signed URLs)
- No file size limit needed (enforced in the API)

### 2d. Enable Google Auth (optional)
1. Go to **Authentication → Providers → Google**
2. Follow the OAuth setup guide
3. Add your Vercel deployment URL to the redirect list

### 2e. Get your API keys
Go to **Settings → API**:
- Copy `URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role` key → `SUPABASE_SERVICE_KEY` (keep secret!)

---

## 3. Local Development

```bash
# Clone the repo
git clone https://github.com/yourusername/future-self-messenger
cd future-self-messenger

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase keys in .env.local

# Run the development server
npm run dev
```

Visit http://localhost:3000

---

## 4. Resend (Email) Setup

1. Go to https://resend.com → Create account
2. Add and verify your sending domain (or use `onboarding@resend.dev` for testing)
3. Create an API key → add to `.env.local` as `RESEND_API_KEY`
4. Set `FROM_EMAIL` to your verified sender address

> If you skip email setup, capsules are still delivered in-app — email is best-effort.

---

## 5. Deploy to Vercel

### 5a. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/future-self-messenger
git push -u origin main
```

### 5b. Import to Vercel
1. Go to https://vercel.com → **Add New Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)

### 5c. Set Environment Variables
In Vercel project settings → **Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL       = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = your-anon-key
SUPABASE_SERVICE_KEY           = your-service-role-key
NEXT_PUBLIC_APP_URL            = https://your-app.vercel.app
RESEND_API_KEY                 = re_your_key
FROM_EMAIL                     = noreply@yourdomain.com
CRON_SECRET                    = your-random-secret
```

### 5d. Deploy
Click **Deploy**. Vercel will build and deploy automatically.

### 5e. Add your live URL to Supabase
In Supabase → **Authentication → URL Configuration**:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

---

## 6. Cron Job (Delivery System)

The `vercel.json` file configures a cron job that runs **every hour**:

```json
{
  "crons": [
    {
      "path": "/api/cron/deliver",
      "schedule": "0 * * * *"
    }
  ]
}
```

This calls `/api/cron/deliver`, which:
1. Queries for all `sealed` capsules with `delivery_at <= NOW()`
2. Marks them as `delivered`
3. Sends email notifications (if Resend is configured)

> Vercel Hobby supports 2 cron jobs. The cron is authenticated via `CRON_SECRET`.

---

## 7. Project Structure

```
future-self-messenger/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, metadata)
│   │   ├── globals.css             # Global styles + animations
│   │   ├── page.tsx                # Landing page
│   │   ├── dashboard/page.tsx      # User's journal dashboard
│   │   ├── journal/page.tsx        # Journal book view
│   │   ├── new-entry/page.tsx      # Create new capsule
│   │   ├── login/page.tsx          # Auth page
│   │   └── api/
│   │       ├── capsules/
│   │       │   ├── route.ts        # GET list, POST create
│   │       │   └── [id]/route.ts   # GET, PATCH, DELETE single
│   │       ├── profile/route.ts    # GET, PATCH profile
│   │       ├── upload/route.ts     # POST media/seal uploads
│   │       └── cron/deliver/route.ts  # Hourly delivery job
│   ├── lib/
│   │   ├── supabase.ts             # DB client + storage helpers
│   │   └── email.ts                # Resend email service
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── middleware.ts               # Auth route protection
├── supabase/
│   └── schema.sql                  # Full DB schema + RLS policies
├── vercel.json                     # Cron job config
├── .env.example                    # Environment variable template
└── package.json
```

---

## 8. API Reference

### Capsules
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/capsules` | List all capsules for current user |
| `GET` | `/api/capsules?status=sealed` | Filter by status |
| `POST` | `/api/capsules` | Create new capsule |
| `GET` | `/api/capsules/:id` | Get single capsule (+ signed URLs if delivered) |
| `PATCH` | `/api/capsules/:id` | Update media_path / seal_image after upload |
| `DELETE` | `/api/capsules/:id` | Delete a sealed capsule |

### Profile
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/profile` | Get current user's profile |
| `PATCH` | `/api/profile` | Update name, cover settings (JSON) |
| `PATCH` | `/api/profile` | Upload cover image (multipart/form-data) |

### Upload
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload?type=media&capsule_id=X` | Upload audio/video |
| `POST` | `/api/upload?type=seal&capsule_id=X` | Upload seal artwork |

### Cron
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cron/deliver` | Run delivery job (Vercel calls this hourly) |

---

## 9. Post-Launch Checklist

- [ ] Test capsule creation → text, audio, video
- [ ] Test cron delivery (manually call `/api/cron/deliver` with your secret)
- [ ] Verify email delivery with a real address
- [ ] Test storage signed URLs expire correctly
- [ ] Check Supabase RLS: confirm users can't access each other's capsules
- [ ] Monitor Vercel logs for cron job runs
- [ ] Set up Supabase usage alerts (Storage + DB quota)

---

## 10. Scaling Beyond Free Tier

When you outgrow free tiers:

| Concern | Solution |
|---------|---------|
| Storage > 1 GB | Switch to Cloudflare R2 (10 GB free, zero egress) |
| Emails > 3,000/mo | Upgrade Resend ($20/mo for 50k) |
| DB > 500 MB | Supabase Pro ($25/mo) |
| More users | Supabase Pro supports 100k MAUs |
| Cron accuracy | Use cron-job.org (free) as external trigger |

---

*Built with ❤️ — inspired by a quiet café in Tokyo where visitors write letters to their future selves.*
