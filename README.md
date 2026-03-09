# Future Self

*Write a letter. Seal it with wax. Let your future self find it.*
Inspired by a quiet café in Tokyo where visitors write letters to themselves, seal them, and receive them a year later — Future Self Messenger is a digital time capsule journal. Capture a moment in text, voice, or video, choose your delivery date, press your wax seal, and forget about it. On the day it's due, it arrives back to you like a gift from the past.

---

## The Ritual

Sit at a quiet desk.
You write something honest — a letter, a voice note, a video — addressed to the person you'll be in one, two, or five years, or even addressed to a friend. You choose a wax colour, pick a symbol, pour the seal. The capsule locks. You can see it sitting there in your journal, sealed, but you cannot open it. On the delivery date, the app unlocks it, sends you an email, and your past self's words are waiting.

The whole thing runs on free infrastructure. No subscription, no credit card, no expiry.

---

## Core Features
- **Modern Premium UI** — Rich dark theme, glassmorphic panels, and cinematic page transitions.
- **Three Capsule Types** — Written letter, voice recording (with live canvas waveform audio visualizer), or video.
- **Recipient Selector** — Send to your future self, or queue a message to send to someone else's email address in the future.
- **Minute-Precise Timer Dial** — A tactile, Apple-style scrollable rotary dial to pick the exact minute, hour, day, month, or year for delivery.
- **Wax Seal Studio** — 8 wax colours, 12 symbols, interactive wax-pooling animations.
- **Reflection Prompts** — 8 handwritten prompts to spark honest writing.
- **Leather Journal** — Massive responsive 3D floating book.
- **Delivery Email** — Beautiful HTML letter sent via Resend on delivery day, supporting custom recipients.
- **Sealed = Locked** — Capsules are genuinely unreadable and secured by strict Supabase RLS.
- **Page-Flip Journal** — Stunning 2-page book spread with CSS 3D realistic flip animation and authentic paper textures.
- **Google + Email Auth** — Via Supabase Auth.
- **Fully Free** — Runs entirely on free tiers (Supabase, Vercel, Resend).

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend + API | Next.js 14 App Router, TypeScript |
| Styling | Vanilla CSS, premium glassmorphic dark UI |
| Database + Auth | Supabase (Postgres + Row Level Security) |
| File storage | Supabase Storage (private buckets, signed URLs) |
| Email | Resend (3,000 free emails/month) |
| Hosting | Vercel Hobby (free) |
| Scheduled delivery | External Cron Job / Vercel Cron |

---

## Get Started & Deployment Guide
This repository is configured so anyone can clone it and launch their own Future Self Messenger on 100% free infrastructure. 

Please see the comprehensive **[DEPLOYMENT.md](DEPLOYMENT.md)** guide for step-by-step instructions on setting up Supabase, linking Resend, deploying to Vercel, and configuring a free 1-minute precision cron job.

---

## Inspiration

This project began with a video about a café in Tokyo that offers a peculiar ritual: you write a letter to yourself, seal it with wax, and drop it into their mailbox. They post it back to you exactly one year later. There's something profound about the delay — the forced perspective, the surprise of meeting your past self's handwriting, the realisation of how much (or how little) has changed.

This app is an attempt to carry that ritual into everyday life.