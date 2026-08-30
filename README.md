# Abode

Private, single-user personal finance dashboard. Replaces a Google Sheets expense
tracker with a live, reactive web app. Built to the spec in [`BUILD-BRIEF.md`](./BUILD-BRIEF.md).

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind v4** (design tokens as CSS variables — `app/globals.css`)
- **Supabase** — Postgres, Auth (magic link), Row Level Security
- **React Query** + Supabase realtime for a reactive data layer
- Hand-built SVG for the quota rings (no chart library)
- Fonts: Gabarito (display) + Sora (body) via `next/font/google`

## Phase 1 scope (this build)

Auth (owner-only magic link), schema + seed, dashboard: net worth hero, earned/
spent/kept trio, quota rings, pot cards, quick add, month switcher, upcoming stub.

> Phase 2 (not built): flow diagram, Google Sheet history import, sparklines & trends.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # publishable key is fine
SUPABASE_SERVICE_ROLE_KEY=          # server only, Phase 2 seed script
ADMIN_EMAIL=                        # the only address allowed to sign in
```

## Database

Schema, RLS policies, seed, and the `add_expense` / `add_income` RPCs are applied as
Supabase migrations. Only the owner (a signed-in user) can read/write; RLS is enabled
on every table.

## Auth notes

- Only `ADMIN_EMAIL` can request or complete a sign-in link (checked at send + callback).
- After deploying, add the deployed origin to Supabase → Authentication → URL
  Configuration (Site URL + Redirect URLs, include `/auth/confirm`).
