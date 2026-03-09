# Future Self — Deployment Guide

This document outlines how to successfully launch your own free instance of the **Future Self** application, from cloning the repo, to configuring your databases, handling email routing, and pushing it live onto the public internet using Vercel.

## 1. Running locally
To start working on the project on your machine, you need a few core accounts. Don't worry, every single one of these has a generous free tier that will comfortably run your application essentially forever.

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project
- A free [Resend](https://resend.com) developer account (optional — but required for email delivery)

### Initial Setup
```bash
git clone https://github.com/YOUR_USERNAME/future-self-messenger.git
cd future-self-messenger/app
npm install
```

---

## 2. Set up Supabase (Database & Storage)
Supabase handles the Postgres Database, Authentication, and private Cloud Storage for your voice/video capsules.

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** on the left-side panel and paste + run the entire contents of `app/supabase/schema.sql`.
   - *This will instantly scaffold out the `profiles` and `capsules` tables, establish the RLS security policies, provision the storage buckets, and create the profile trigger.*
3. Go to **Project Settings → API** and locate your keys.
4. Copy `app/.env.example` into `app/.env` (or `.env.local`).
5. Fill in the Supabase values in your `.env` file:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your `anon` / public key
   - `SUPABASE_SERVICE_KEY` = Your `service_role` / secret key

---

## 3. Set up Resend (Email Deliverability)
Resend acts as the mailing postman, generating the HTML delivery emails for ripe capsules.

1. Sign up/log in at [Resend.com](https://resend.com).
2. Go to **API Keys** and generate a new key. Paste this into your `.env` file under `RESEND_API_KEY`.
3. Fill in your `FROM_EMAIL`:
   - **During testing without a domain:** Use `onboarding@resend.dev`. Note that in testing mode, Resend will *only* allow emails sent to the specific email address you used to register your developer account.
   - **Production:** Go to "Domains" on Resend, verify a custom domain you own via DNS, and set it (e.g., `hello@yourdomain.com`). This allows emailing anyone (which is necessary for the Recipient feature).

---

## 4. Run the Development Server
Fill out the final few variables in your `.env` file:
- `NEXT_PUBLIC_APP_URL` = `http://localhost:3000` (Update this later to your Vercel URL)
- `CRON_SECRET` = A strong custom password (e.g., generator: `openssl rand -hex 32`)

```bash
cd app
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 5. Deploying to Vercel
Vercel handles the Next.js hosting and edge routing permanently for free.

1. Push your code to your GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repository.
3. **CRITICAL:** Vercel looks in the root directory by default. In the Vercel **Settings → General** page:
   - **Root Directory:** Change this to `app` and save.
   - **Framework Preset:** Ensure this is set to **Next.js**.
4. In the Vercel **Environment Variables** tab, paste *all* of your `.env` variables from Step 4. Update the `NEXT_PUBLIC_APP_URL` variable to whatever your Vercel URL has been assigned (e.g., `https://future-self.vercel.app`).
5. **Deploy!**

### Finalizing Supabase Auth Config
For social login and magic links to work in production, Supabase needs to recognise your new Vercel URL.
1. In Supabase, go to **Authentication → URL Configuration**.
2. Set **Site URL** to `https://your-app.vercel.app`.
3. Add `https://your-app.vercel.app/auth/callback` to the **Redirect URLs** list.

---

## 6. Real-time Email Deliveries (Bypassing Vercel Hobby Limits)
By default, the Vercel Hobby tier only allows internal cron jobs to execute once every 24 hours. Because the Future Self Timer Dial supports precision down to the minute, a daily cron job will cause severe delivery delays.

To achieve free, 1-minute precision delivery scanning:
1. Ensure your `vercel.json` file is set to `"0 0 * * *"` so the Vercel builder doesn't throw a tier-limit error.
2. Sign up for a free pinging service like **[cron-job.org](https://cron-job.org/)**.
3. Create a new Cronjob facing your app API:
   - **URL:** `https://YOUR_VERCEL_APP_URL/api/cron/deliver`
   - **Execution schedule:** Every 1 minute
4. Switch to the **Advanced** configuration tab in cron-job.org, scroll to "Headers", and map the secret you generated to bypass the API protections:
   - **Key:** `Authorization`
   - **Value:** `Bearer YOUR_CRON_SECRET` (Use the exact string from your `.env` file).
5. Save.

This external service will securely "knock on the door" of your database every 60 seconds completely for free, scanning for any ripe capsules and instantly dispatching the newly updated emails!
