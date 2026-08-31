import type { BucketView, ExpenseEntry, IncomeEntry, Pot, QuotaConfig, BucketKey } from "./types";

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

// Build the four bucket views for the rings + legend.
export function buildBuckets(
  quota: QuotaConfig[],
  expenses: ExpenseEntry[],
  monthlyIncome: number,
): BucketView[] {
  return [...quota]
    .sort((a, b) => a.sort - b.sort)
    .map((q) => {
      const spent = sumAmount(
        expenses.filter((e) => e.bucket_key === q.key),
      );
      const allocated = allocationFor(q.pct, monthlyIncome);
      const { pct, over } = ringFill(spent, allocated);
      return {
        key: q.key as BucketKey,
        name: q.name,
        color: q.color,
        allocated,
        spent,
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
): MonthDerived {
  const earned = sumAmount(income);
  const spent = sumAmount(expenses);
  const buckets = buildBuckets(quota, expenses, earned);
  return {
    earned,
    spent,
    kept: earned - spent,
    buckets,
    totalAllocated: buckets.reduce((s, b) => s + b.allocated, 0),
  };
}
