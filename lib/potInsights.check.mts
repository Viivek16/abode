// Runnable self-check for the Pots-section vitals.
// Run:  node lib/potInsights.check.mts   (Node strips the TS types natively)

import assert from "node:assert/strict";
import { potInsights } from "./logic.ts";

const pot = (o: Record<string, unknown>) =>
  ({ id: "x", key: "x", name: "Pot", bucket_key: null, color: null, icon: null, is_bank: false, current_balance: 0, created_at: "", ...o }) as never;

const by = (rows: ReturnType<typeof potInsights>) =>
  Object.fromEntries(rows.map((r) => [r.key, r]));

// Funded month: ₹1L earned, ₹20k spent, ₹80k allocated, ₹60k emergency pot.
const a = by(
  potInsights({
    earned: 100000,
    spent: 20000,
    moved: 80000,
    pots: [pot({ is_bank: true, current_balance: 20000 }), pot({ name: "Emergency", bucket_key: "emergency", current_balance: 60000 })],
    monthly: [{ ym: "2026-01", income: 100000, spent: 20000 }],
    expenses: [{ bucket_key: "personal", amount: 12000 }, { bucket_key: "bills", amount: 8000 }],
    buckets: [{ key: "personal", name: "Personal" }, { key: "bills", name: "Bills" }],
  }),
);
assert.equal(a.idle.currency?.n, 20000);
assert.equal(a.rate.display, "80%");
assert.equal(a.rate.tone, "positive");
assert.equal(a.top.display, "60%"); // Personal is 12k of 20k spent
assert.equal(a.top.caption, "on Personal");
assert.equal(a.runway.display, "3.0 mo"); // 60k / 20k avg spend
assert.deepEqual(a.pace.currency, { n: 960000, fmt: "compact" }); // (100k-20k) x 12
assert.equal(a.alloc.display, "80%");
assert.equal(a.alloc.caption, "of income has a home");

// Brand-new: income only, nothing spent or allocated.
const b = by(
  potInsights({
    earned: 150000,
    spent: 0,
    moved: 0,
    pots: [pot({ is_bank: true, current_balance: 150000 })],
    monthly: [{ ym: "2026-06", income: 150000, spent: 0 }],
    expenses: [],
    buckets: [],
  }),
);
assert.equal(b.idle.currency?.n, 150000);
assert.equal(b.rate.display, "100%");
assert.equal(b.top.display, "—");
assert.equal(b.top.caption, "no spend yet");
assert.equal(b.runway.caption, "start an emergency pot");
assert.equal(b.alloc.caption, "nothing allocated yet");

// No income at all: rate + allocation gracefully unknown, not a crash.
const c = by(potInsights({ earned: 0, spent: 0, moved: 0, pots: [], monthly: [], expenses: [], buckets: [] }));
assert.equal(c.rate.display, "—");
assert.equal(c.alloc.display, "—");

console.log("potInsights.check.mts: all assertions passed");
