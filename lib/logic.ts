import type { BucketView, ExpenseEntry, IncomeEntry, Pot, QuotaConfig, BucketKey, Transfer } from "./types";

// ---- Month helpers ('YYYY-MM') ----
export const ymOf = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const currentYm = () => ymOf(new Date());

export function shiftYm(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return ymOf(d);
}

export function ymLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

// The date to stamp on an entry filed under `ym`: today if that month is the
// live one, else the first of that month. The Supabase RPC derives `ym` from it.
export const dateForYm = (ym: string, today = new Date()): string =>
  ym === ymOf(today) ? today.toISOString().slice(0, 10) : `${ym}-01`;

// ---- Business logic (Section 7) ----

// allocated[b] = round(pct/100 * monthlyIncome)
export const allocationFor = (pct: number, monthlyIncome: number) =>
  Math.round((pct / 100) * monthlyIncome);

// ring fill = min(spent / allocated, 1); over = spent > allocated
export function ringFill(spent: number, allocated: number) {
  if (allocated <= 0) return { pct: spent > 0 ? 1 : 0, over: spent > 0 };
  return { pct: Math.min(spent / allocated, 1), over: spent > allocated };
}

// liquid net worth = sum of all pot balances
export const netWorth = (pots: Pot[]) =>
  pots.reduce((sum, p) => sum + Number(p.current_balance), 0);

// delta vs previous month = (now - prev) / prev
export function deltaPct(now: number, prev: number): number | null {
  if (!prev) return null;
  return (now - prev) / prev;
}

export const sumAmount = (rows: { amount: number }[]) =>
  rows.reduce((s, r) => s + Number(r.amount), 0);

// Build the four bucket views for the rings + legend. The ring/legend track how
// much of each bucket's quota has been *allocated into pots* (moved), which is
// what the "Allocated this month" card promises — spending is shown elsewhere.
export function buildBuckets(
  quota: QuotaConfig[],
  expenses: ExpenseEntry[],
  transfers: Transfer[],
  monthlyIncome: number,
): BucketView[] {
  return [...quota]
    .sort((a, b) => a.sort - b.sort)
    .map((q) => {
      const spent = sumAmount(expenses.filter((e) => e.bucket_key === q.key));
      const moved = sumAmount(transfers.filter((t) => t.quota_key === q.key));
      const allocated = allocationFor(q.pct, monthlyIncome);
      const { pct, over } = ringFill(moved, allocated);
      return {
        key: q.key as BucketKey,
        name: q.name,
        color: q.color,
        allocated,
        spent,
        moved,
        fill: pct,
        over,
      };
    });
}

export type MonthDerived = {
  earned: number;
  spent: number;
  kept: number;
  buckets: BucketView[];
  totalAllocated: number;
};

export function deriveMonth(
  quota: QuotaConfig[],
  income: IncomeEntry[],
  expenses: ExpenseEntry[],
  transfers: Transfer[],
): MonthDerived {
  const earned = sumAmount(income);
  const spent = sumAmount(expenses);
  const buckets = buildBuckets(quota, expenses, transfers, earned);
  return {
    earned,
    spent,
    kept: earned - spent,
    buckets,
    totalAllocated: buckets.reduce((s, b) => s + b.allocated, 0),
  };
}

// ---- Pots-section "vitals" (Section 8) ----
// Derived figures a user won't compute themselves — synthesised from the
// ledger so the Pots section stays informative even before pots are funded.
// Every value is real (no guessing). Rate/top/allocation read the displayed
// month; runway/pace lean on history so they mean something with one month too.
// `display` holds ready strings (percentages, "3.0 mo", the "—" placeholder);
// `currency` defers ₹ formatting to the view, which owns the formatters. Exactly
// one of the two is set per tile.
export type PotInsight = {
  key: string;
  label: string;
  display: string;
  currency?: { n: number; fmt: "rupee" | "compact" };
  caption: string;
  tone: "accent" | "positive" | "ink";
};

export function potInsights(args: {
  earned: number;
  spent: number;
  moved: number;
  pots: Pot[];
  monthly: { ym: string; income: number; spent: number }[];
  expenses: { bucket_key: BucketKey | null; amount: number }[];
  buckets: { key: BucketKey; name: string }[];
}): PotInsight[] {
  const { earned, spent, moved, pots, monthly, expenses, buckets } = args;

  const bank = pots
    .filter((p) => p.is_bank)
    .reduce((s, p) => s + Number(p.current_balance), 0);
  const emergency = pots
    .filter((p) => !p.is_bank && (p.bucket_key === "emergency" || /emergenc/i.test(p.name)))
    .reduce((s, p) => s + Number(p.current_balance), 0);

  const spentMonths = monthly.filter((m) => m.spent > 0);
  const avgSpend = spentMonths.length
    ? spentMonths.reduce((s, m) => s + m.spent, 0) / spentMonths.length
    : spent;
  const keptRows = monthly.length ? monthly : [{ ym: "", income: earned, spent }];
  const avgKept = keptRows.reduce((s, m) => s + (m.income - m.spent), 0) / keptRows.length;

  const byBucket = new Map<string, number>();
  for (const e of expenses) {
    if (!e.bucket_key || Number(e.amount) <= 0) continue;
    byBucket.set(e.bucket_key, (byBucket.get(e.bucket_key) ?? 0) + Number(e.amount));
  }
  let topKey: string | null = null;
  let topAmt = 0;
  for (const [k, v] of byBucket) {
    if (v > topAmt) {
      topAmt = v;
      topKey = k;
    }
  }
  const bucketName = (k: string) => buckets.find((b) => b.key === k)?.name ?? k;

  const savingsRate = earned > 0 ? (earned - spent) / earned : null;
  const allocShare = earned > 0 ? Math.min(moved / earned, 1) : null;
  const runway = emergency > 0 && avgSpend > 0 ? emergency / avgSpend : null;
  const annual = avgKept * 12;
  const pct = (x: number) => Math.round(x * 100) + "%";

  return [
    {
      key: "idle",
      label: "Idle cash",
      display: "",
      currency: { n: bank, fmt: "rupee" },
      caption: bank > 0 ? "waiting for a job" : "all put to work",
      tone: "accent",
    },
    {
      key: "rate",
      label: "Savings rate",
      display: savingsRate == null ? "—" : pct(savingsRate),
      caption:
        savingsRate == null ? "add income to see"
        : savingsRate >= 0.2 ? "healthy — keep going"
        : savingsRate >= 0.1 ? "steady"
        : savingsRate >= 0 ? "tight this month"
        : "spent over income",
      tone: savingsRate != null && savingsRate >= 0.2 ? "positive" : "ink",
    },
    {
      key: "top",
      label: "Top spend",
      display: topKey && spent > 0 ? pct(topAmt / spent) : "—",
      caption: topKey && spent > 0 ? `on ${bucketName(topKey)}` : "no spend yet",
      tone: "ink",
    },
    {
      key: "runway",
      label: "Emergency runway",
      display:
        runway == null ? "—" : (runway >= 10 ? Math.round(runway) : runway.toFixed(1)) + " mo",
      caption:
        runway == null
          ? emergency > 0 ? "add spending to gauge" : "start an emergency pot"
          : "of expenses covered",
      tone: runway != null && runway >= 6 ? "positive" : "ink",
    },
    {
      key: "pace",
      label: "Yearly pace",
      display: annual > 0 ? "" : "—",
      currency: annual > 0 ? { n: annual, fmt: "compact" } : undefined,
      caption: annual > 0 ? "projected savings / yr" : "save to project",
      tone: "ink",
    },
    {
      key: "alloc",
      label: "Allocation health",
      display: allocShare == null ? "—" : pct(allocShare),
      caption:
        allocShare == null ? "add income to see"
        : allocShare >= 0.8 ? "of income has a home"
        : allocShare > 0 ? "of income allocated"
        : "nothing allocated yet",
      tone: allocShare != null && allocShare >= 0.8 ? "accent" : "ink",
    },
  ];
}
