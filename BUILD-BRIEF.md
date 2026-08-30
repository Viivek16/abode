# Personal Finance Dashboard — Build Brief for Claude Code

A private, single-user finance dashboard. It replaces a Google Sheets expense tracker with a live, reactive web app that works on desktop and mobile, deployed to Vercel, accessible only by the owner.

---

## 0. How to use this brief

1. Save this file at the repo root as `BUILD-BRIEF.md`.
2. Tell Claude Code: "Read BUILD-BRIEF.md and build Phase 1 only. Stop at the acceptance criteria and show me."
3. Answer the open questions in Section 12 when the build reaches those parts. Do not let the build guess them.

**Hard rules for the build:**
- Every number in this document is a placeholder for layout only. Never treat placeholder values as real data. Real data comes from Supabase, seeded from the verified sheet import.
- If any Google Sheet structure is unclear, stop and ask. Do not invent columns, tabs, or values.
- Keep dependencies minimal. Prefer the framework and hand-built SVG over adding libraries.
- Row Level Security on every table. No secrets in client code.

---

## 1. The model (how the money actually flows)

The owner runs a waterfall each month:

1. Income arrives from several sources, each tagged as Salary, Bills, Investments, or Personal.
2. Net income is split into four quota buckets by a fixed rule: **Bills + Savings 40 percent, Investments 30 percent, Emergency 15 percent, Personal 15 percent.**
3. Money is transferred out of the quota into physical pots (Savings, Vacation, Emergency, Stocks, Crypto, Mutual Funds, Bank, and similar).
4. Whatever is left in Personal is day-to-day spendable money.

The dashboard should make this flow feel alive: allocation that fills, a flow that moves, balances that update the moment an expense is added.

---

## 2. Tech stack

Use these. Verify current versions and patterns against official docs before wiring auth or migrations.

- **Next.js** (App Router, latest stable) with **TypeScript** and **React**.
- **Tailwind CSS** for utilities. Design tokens live as CSS variables (Section 3) so the look is not locked to Tailwind.
- **Supabase**: Postgres for data, Auth for login, Row Level Security. Use `@supabase/ssr` for the Next.js server and client integration. Confirm the current recommended auth pattern in the Supabase docs.
- **Fonts**: `next/font/google`. Gabarito for display, Sora for body. Both are real Google Fonts.
- **Charts and visuals**: hand-built SVG for the rings, the flow, and the sparklines. Do not pull in a heavy chart library. Recharts is allowed only if a specific case truly needs it.
- **Data layer**: Supabase client plus React Query or SWR, with Supabase realtime subscriptions so a change on one device updates the others.
- **Deploy**: Vercel.

---

## 3. Design system (locked, use exactly)

### 3.1 Colors

```css
:root {
  /* surfaces */
  --bg: #14100E;          /* warm near-black, app background */
  --surface: #1E1714;     /* cards */
  --surface-2: #271D18;   /* nested surfaces, tracks */
  --edge: rgba(255,255,255,0.08);

  /* text */
  --ink: #F3ECE6;         /* primary */
  --muted: #A08E82;       /* secondary */
  --faint: #6E5F55;       /* tertiary */

  /* brand */
  --accent: #CDA349;      /* honey-gold, hero numbers + primary buttons */
  --accent-soft: #E0BE73;
  --positive: #8FB3A3;    /* sage, gains */
  --negative: #CE8A7E;    /* dusty rose, losses */

  /* quota buckets */
  --bucket-bills: #7FA893;
  --bucket-invest: #8C93C7;
  --bucket-personal: #B487AE;
  --bucket-emergency: #CBA35C;

  /* radii */
  --r-card: 20px;
  --r-button: 13px;
  --r-pill: 999px;
}
```

Do not introduce new accent colors. Honey is the only brand accent. Sage and dusty rose are semantic only (up and down).

### 3.2 Typography

```ts
// lib/fonts.ts
import { Gabarito, Sora } from "next/font/google";

export const display = Gabarito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

export const body = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
```

Rules:
- **Gabarito (display)** is for large numbers, primary buttons, and big headings only. Nothing small, nothing paragraph length.
- **Sora (body)** is for every label, list, value, and piece of readable text.
- All figures use `font-variant-numeric: tabular-nums` so digits do not shift while animating.

Type scale (approximate, tune to taste): hero number 44 to 52, section eyebrow 11 uppercase with 0.16em tracking, body 14, small label 11.

### 3.3 Motion

- Big numbers count up on load and on change, roughly 850ms, ease-out.
- Ring fill animates via `stroke-dashoffset` transition, roughly 900ms, `cubic-bezier(.22,1,.36,1)`.
- The flow links have a slow animated dash so money looks like it is moving.
- Honor `prefers-reduced-motion: reduce` by disabling all of the above.

### 3.4 Look and feel rules

- Dark and warm. Never a cold blue-black.
- Gradient appears only as a soft ambient glow behind a card. Never on buttons, never on text.
- No emoji as icons. If an icon is needed, use a clean line set such as lucide, sparingly. Many places need no icon at all.
- Currency is Indian Rupees with Indian digit grouping. See Section 8.

---

## 4. Screens and navigation

- **Dashboard** (default, shows the selected month): net worth hero, earned/spent/kept trio, quota rings, the flow, pot cards, and a locked "Upcoming" strip.
- **Quick Add** (a bottom sheet that slides up): the daily driver for logging an expense or income.
- **Month switcher**: moves between months, everything on the dashboard reacts.
- **Upcoming tab** (stub only in Phase 1): fund managers, lending, big buys, studio setup. Show it labelled as coming later. Do not build it yet.
- **Login gate**: magic-link sign in, owner only.

---

## 5. Components

### NetWorthHero
Eyebrow "Liquid net worth". A large honey number that counts up (Gabarito). A delta versus the previous month in sage or dusty rose, plain text, no emoji arrow. A twelve-month sparkline underneath. Value equals the sum of pot balances (see Section 7).

### StatTrio
Three small cards for the selected month: Earned, Spent, Kept. Values count up. Spent uses dusty rose, Kept uses sage, Earned uses ink.

### QuotaRings
Four concentric rings in the Apple activity style, one per bucket. Fill equals spent divided by allocated for that bucket. If spent exceeds allocated, the ring turns to the negative color and the row flags overspend. Center shows total spent of total allocated. A legend beside it lists each bucket with a color dot, name, and spent over allocated, plus a thin progress bar. Tapping a ring or legend row isolates that bucket and dims the rest.

### Flow (the signature element)
A left to right diagram: one income node, then four bucket nodes, then the pot nodes. Link width is proportional to the amount flowing. Links carry a slow animated dash. Tapping a bucket highlights only its links and connected pots. This is the piece that makes the waterfall legible, invest real effort here.

### PotCards
A grid of glass cards, one per pot: current balance, month-over-month delta percent, a small sparkline, and the bucket color. Investment pots can show returns later.

### QuickAdd
A floating honey button opens a bottom sheet. It has an Expense or Income toggle, category chips mapped to buckets, an amount input, an optional note, and a confirm button. On confirm, write to Supabase optimistically, then the affected ring, the flow, and the net worth animate. A small toast confirms.

### MonthSwitcher
A segmented control or previous/next arrows on a month pill. Defaults to the current month. Changing it recomputes the whole dashboard.

---

## 6. Data model (Supabase, proposed)

Run as migrations. Adjust names as needed, keep the shape.

```sql
-- editable quota rule, seed 40 / 30 / 15 / 15
create table quota_config (
  key   text primary key,        -- 'bills' | 'invest' | 'emergency' | 'personal'
  name  text not null,
  pct   numeric not null,
  color text not null,
  sort  int not null default 0
);

-- pots / accounts money lands in
create table pots (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  bucket_key text references quota_config(key),
  color text,
  icon text,
  is_bank boolean default false,
  current_balance numeric not null default 0,
  created_at timestamptz default now()
);

-- income received
create table income_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  ym text not null,               -- 'YYYY-MM' for grouping
  source_name text not null,      -- e.g. 'Yellow Salary'
  category text,                  -- Salary | Bills | Investments | Personal
  amount numeric not null,
  note text,
  created_at timestamptz default now()
);

-- expenses, each tagged to a quota bucket
create table expense_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  ym text not null,
  bucket_key text references quota_config(key),
  category text,                  -- e.g. 'Car EMI', 'Groceries'
  amount numeric not null,
  note text,
  created_at timestamptz default now()
);

-- physical transfers from a quota into a pot
create table transfers (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  ym text not null,
  pot_id uuid references pots(id),
  quota_key text references quota_config(key),
  amount numeric not null,
  created_at timestamptz default now()
);

-- monthly pot balance snapshots, for sparklines and history
create table pot_snapshots (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid references pots(id),
  ym text not null,
  balance numeric not null,
  unique (pot_id, ym)
);

-- misc config (split base, mappings, feature flags)
create table app_config (
  key text primary key,
  value jsonb not null
);
```

Seed for `quota_config`:

```sql
insert into quota_config (key, name, pct, color, sort) values
  ('bills',     'Bills + Savings', 40, '#7FA893', 1),
  ('invest',    'Investments',     30, '#8C93C7', 2),
  ('emergency', 'Emergency',       15, '#CBA35C', 3),
  ('personal',  'Personal',        15, '#B487AE', 4);
```

Row Level Security, enable on every table. Since only the owner can sign in (Section 9), a signed-in check is acceptable for Phase 1, then tighten to the owner's user id:

```sql
alter table income_entries enable row level security;
create policy "owner rw" on income_entries
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
-- repeat for every table
```

A helper view for month totals:

```sql
create view monthly_totals as
select m.ym,
  coalesce((select sum(amount) from income_entries  i where i.ym = m.ym), 0) as earned,
  coalesce((select sum(amount) from expense_entries e where e.ym = m.ym), 0) as spent
from (
  select ym from income_entries
  union
  select ym from expense_entries
) m;
```

Kept equals earned minus spent.

---

## 7. Business logic

- **Allocation per bucket** for a month: `allocated[b] = round(quota_config[b].pct / 100 * monthlyIncome)`. Use total income for the month as `monthlyIncome` unless Section 12 says otherwise.
- **Ring fill**: `pct = min(spent / allocated, 1)`, `over = spent > allocated`.
- **Liquid net worth**: sum of all `pots.current_balance`. Delta versus previous month equals `(now - prev) / prev`.
- **Kept / spendable**: earned minus spent for the month.
- Everything recomputes when the selected month changes.

---

## 8. Currency and formatting

```ts
export const rupee = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e7) return "₹" + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (a >= 1e5) return "₹" + (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  if (a >= 1e3) return "₹" + (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return "₹" + Math.round(n);
};
```

Use `rupee` for exact figures, `compact` for tight spaces like chips and cards.

---

## 9. Auth (owner only)

- Supabase Auth with magic link.
- Allow sign in only for the owner email, read from `ADMIN_EMAIL`. Reject any other address at the callback.
- Protect all app routes with middleware. An unauthenticated visitor sees only the login page.
- After Phase 1 works, tighten RLS policies from "signed in" to the owner's specific `auth.uid()`.

---

## 10. Google Sheet import (history: 2024 through July 2026)

The sheet stays as the historical source and a read-only place to verify numbers. Import once into Supabase, then new months are entered in the app. A two-way Sheets API sync is a later phase, not now.

**Source tabs seen in screenshots:** a Balance Sheet tab (year comparison for 2024, 2025, 2026, plus pot values, fund managers, studio setup, lending, big buys) and monthly tabs (January through July 2026). Only the Balance Sheet and the May 2026 tab were shared as images, so the rest must be checked against the live sheet.

**Approach:**
1. Export each tab as CSV, or read via the Sheets API.
2. Write a one-time seed script at `scripts/seed-from-sheet.ts`.
3. Make it idempotent and run a dry run first that prints what it would insert. Do not write until the owner confirms the dry run looks right.

**Proposed mapping, verify every column against the live sheet before running:**

| Sheet region (monthly tab) | Supabase target |
|---|---|
| Top table rows where Income is filled (source in column A, category in column B, amount in Income) | `income_entries` |
| Top table rows where Expense is filled (label in column A, category in column B mapped to a bucket, amount in Expense) | `expense_entries` |
| Quota table percentages (Bills+Savings 40, Investments 30, Emergency 15, Personal 15) | `quota_config.pct` |
| Transferred-to table (pot in column A, transfer amount, quota type) | `transfers` |
| Balance Sheet pot values and monthly quota balances | `pots.current_balance` and `pot_snapshots` |

Category to bucket mapping to confirm: Bills goes to `bills`, Investments to `invest`, Personal to `personal`, and travel handling is an open question in Section 12.

---

## 11. Build phases and acceptance criteria

**Phase 1 (MVP), build this first:**
Auth, schema and seed, dashboard with net worth hero, stat trio, quota rings and pot cards, quick add, month switcher, deployed to Vercel.

Acceptance:
- The owner can sign in, no one else can.
- On mobile, adding an expense updates the correct ring, the spent and kept figures, and the net worth, within the same view.
- Switching months recomputes everything.
- Data persists in Supabase and survives refresh.
- The app is live on a Vercel URL.

**Phase 2:** the flow diagram, the sheet history import for 2024 through July 2026, sparklines and trends.

**Phase 3:** the Upcoming tab (fund managers, lending, big buys, studio), goals and returns tracking, optional two-way Sheets sync, export.

---

## 12. Open questions, confirm before building the affected part

1. **Travel funding.** Is Vacation its own quota line, or a pot funded from the Emergency 15 percent? The May sheet tags a Vacation transfer as Emergency. Default until told otherwise: Vacation is a pot funded from the Emergency quota. This is configurable.
2. **Split base.** Is the 40/30/15/15 split applied to total monthly income, or to income after fixed costs? Default: total monthly income.
3. **Exact sheet columns.** The mapping in Section 10 is from two screenshots only. Confirm column positions on every tab before the seed script writes anything.
4. **Pot list.** Confirm the final set of pots to seed. Seen so far: Savings, Scapia Card, Vacation, Emergency, Stocks, Crypto, Mutual Funds, and a Bank balance.
5. **Bank.** Track Bank as a pot with `is_bank = true`, or keep it separate? Default: a pot flagged as bank.

---

## 13. Guardrails

- Placeholder numbers in this brief are for layout only. Never surface them as real.
- Seed only from the verified sheet import. Do not fabricate history.
- If a sheet structure is ambiguous, stop and ask rather than guess.
- Keep the dependency list short. Reach for the platform and SVG first.
- Accessibility floor: visible keyboard focus, reduced motion respected, readable contrast on the warm dark theme.
- Every table has RLS. Service role key is server only.

---

## 14. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only, used by the seed script
ADMIN_EMAIL=                    # the only address allowed to sign in
```

---

## 15. Suggested repo structure

```
app/
  (auth)/login/
  (app)/page.tsx            # dashboard
  api/
components/
  hero/  rings/  flow/  pots/  quick-add/  month-switcher/
lib/
  supabase/                 # client + server helpers
  format.ts                 # rupee, compact
  logic.ts                  # allocation, ring math, net worth
  fonts.ts
supabase/
  migrations/
scripts/
  seed-from-sheet.ts
```

---

## Summary of locked decisions

- Backend: Supabase is the source of truth. The Google Sheet is the history source and a read-only check.
- Scope for Phase 1: income split, pots, net worth, quick add, month view. Bigger items go to the Upcoming tab later.
- Design: Gabarito for big numbers and buttons, Sora for everything else. Honey #CDA349 accent, sage #8FB3A3 up, dusty rose #CE8A7E down, warm base #14100E. Buckets in sage, periwinkle, mauve, ochre.
- Currency: Indian Rupees, Indian grouping.
- Auth: owner only, magic link. Deploy on Vercel.
