# Abode — Project Memory

Load this at the start of a new Claude Code session to skip re-discovery.

## What it is
A **private, multi-tenant personal-finance dashboard**. Owner: Viivek
(`vivekmehta.vm31@gmail.com`). Opened ~1–2×/month at salary time — it is **not**
an expense tracker. Each user (owner + friends, via Google) gets their **own
isolated** dashboard. Repo: `github.com/Viivek16/abode` (branch `main`),
deployed on **Vercel**. Supabase project id `jizrzsaosmuhdqslgnqm`.

## The money model (the core mental model)
1. **Log income** (salary) → month total.
2. **Auto-split** into 4 quotas by fixed %: **Bills+Savings 40 / Investments 30 /
   Emergency 15 / Personal 15** (`quota_config`, global, same for everyone).
3. **Manual allocation** — the user distributes each quota into **pots**
   (`transfers`). This is their monthly decision, not a rule.
4. **Net worth** = sum of all pot balances (incl. Bank). Income → Bank pot;
   a transfer is a reallocation (Bank −X, target pot +X → net worth flat);
   an expense is Bank −X.

## Stack / conventions
- **Next.js 16** App Router + Turbopack. Middleware is **`proxy.ts`** (renamed).
- React 19, **Supabase** (Postgres 17, Auth, RLS, realtime), **TanStack Query**,
  Tailwind v4, **Fraunces + Sora** fonts, hand-built **SVG** charts.
- `motion` (Framer) is installed but UI motion is **CSS** (cheaper, per skills).
- **AGENTS.md**: "This is NOT the Next.js you know" — read
  `node_modules/next/dist/docs/*` before any Next API work.
- Dev on **Windows** (PowerShell + Bash tools). LF→CRLF git warnings are harmless.

## Supabase
- **Per-user tables** (RLS `auth.uid() = user_id`): `income_entries`,
  `expense_entries`, `transfers`, `pots`, `pot_snapshots`.
- **Global** (read-only for authed): `quota_config` (40/30/15/15 + bucket
  colors), `app_config`.
- **RPCs**: `add_income`, `add_expense`, `add_transfer` (stamp `user_id`, touch
  only the caller's bank pot), `ensure_default_pots` (idempotent starter-pot
  seed for new users).
- **Auth**: Google OAuth (multi-user) + owner email/password fallback
  (`app/(auth)/login/actions.ts`, gated by `ADMIN_EMAIL`). New Google users are
  seeded default pots in `app/auth/callback/route.ts`.
- Migrations: `supabase/migrations/` (this session's 3) + Supabase history
  (init_schema, seed_quota_and_pots, add_entry_rpcs predate the repo record).

## Google Sheet two-way sync — **OWNER ONLY** (friends have no sheet)
- Sheet "Personal Expenses Tracker" (`GOOGLE_SHEET_ID`). Monthly tabs with
  **irregular names** ("Mar 2024" vs "March 2025", "Sept", "April") + Balance Sheet.
- Each monthly tab is a **fixed formula template**: ledger (`Name|Category|Income|
  Expense|Profits`), `Net`=SUM formulas, Quota block (`=40%*C10` …), a
  "Transfered to" table (pot | amount | balance | quota type).
- **Supabase = truth, sheet = mirror.**
- **App→Sheet income** (`/api/sheet/push`): writes each source's monthly sum into
  its pre-named row's Income cell. Map: `NTC`→"NTC Salary", `Yellow`→"Yellow
  Salary", `Freelancing`→"Freelancing"; custom source → new row. Missing month →
  duplicate the latest tab.
- **App→Sheet transfers** (`/api/sheet/push-transfers`): writes each pot's sum
  into the "Transfered to" table (fuzzy match: `Savings`→"Savings Pot",
  `Crypto`→"Crypto (Mudrex)", `Mutual Funds`→"Mutual Funds (Ketan Sheth)").
- **Sheet→App income only** (`/api/sheet/pull`): Apps Script `onEdit`
  (`docs/apps-script.gs`) pings it; upserts the owner's income for (month, source).
- Service-account auth; helpers in `lib/sheets/{client,months,sync}.ts`. All three
  routes are scoped to `ADMIN_EMAIL` — friends' data never reaches the sheet.

## Design system — "warm liquid glass"
- Tokens in `app/globals.css`. Warm-dark bg `#14100E`, honey accent `#D8AC55`,
  four bucket colors. **Fraunces** (serif) for hero/figures/headings, **Sora** for
  body/buttons.
- `.glass` / `.glass-2` translucent blur+saturate cards; `.ambient` glow; `.tap`
  (press) + `.lift` (hover, desktop-gated); `.reveal` staggered entrance; sheets
  use `--ease-drawer` (iOS). `prefers-reduced-motion` + `-transparency` honored.
- Components: `Dashboard` (composes + reveal stagger + skeleton), `NetWorthHero`,
  `StatTrio` (compact), `QuotaRings` (concentric SVG, center in a clear hole),
  `Flow` (SVG sankey, fits mobile no-scroll), `IncomeHeatmap` (month grid + 3-stat
  hover), `PotCards`, `QuickAdd` (income-first FAB sheet), `AllocateSheet`
  (quota→pot distribution), `UpcomingStrip`.

## Env (`.env.local`; `.env.example` is the template; both git-ignored except example)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
`GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `SHEET_SYNC_SECRET`.

## Verify / build
`npm run dev` (login-gated) · `npm run build` · `npm run lint` ·
`node lib/logic.check.mts` · `node lib/sheets/months.check.mts`.

## Pending (next session)
See the "Pending items" list — kept below and also given in chat.

1. **Sheet→App for transfers** (only income flows sheet→app today; app→sheet transfers works).
2. **Recurring bills** (Car EMI, SIPs) — the fixed monthly expense rows aren't modeled/logged in-app.
3. **Expense sheet sync** — parked on the quota-formula `SUMIF` upgrade decision (app expense categories don't match the sheet's fixed rows).
4. **Per-user sheet sync** — friends get no sheet; would need each to connect their own.
5. **Manage-pots UI** — no in-app way to add/rename pots beyond the seeded defaults (owner or friend).
6. **New-user onboarding** — empty states work but are plain; could guide first income → allocate.
7. **Apps Script deploy** (Sheet→App income) — needs the deployed `/api/sheet/pull` URL + `SHEET_SYNC_SECRET` + an On-edit trigger (`docs/apps-script.gs`).
8. **Enable leaked-password protection** (Supabase → Auth → Password security) — remaining low-priority advisor WARN.

## Gotchas
- Owner's Google login **links to the existing email/password account** (same
  email) — verified working on Vercel.
- Heatmap hover **can't be triggered by synthetic events** (React ignores them);
  verify by a real mouse hover.
- Sheet sync is owner-only by design.
