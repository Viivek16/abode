// Runnable self-check for the pure month + allocation logic.
// Run:  node lib/logic.check.mts   (Node 22.6+ strips the TS types natively)

import assert from "node:assert/strict";
import { dateForYm, shiftYm, ymOf, allocationFor, deriveMonth } from "./logic.ts";

// dateForYm: the live month stamps today; a past month stamps its first day.
const today = new Date("2026-09-15T10:00:00Z");
assert.equal(dateForYm(ymOf(today), today), "2026-09-15");
assert.equal(dateForYm("2026-07", today), "2026-07-01");

// shiftYm: backdating September by two months lands on July.
assert.equal(shiftYm("2026-09", -2), "2026-07");

// allocationFor: 40/30/15/15 of ₹5,00,000 splits cleanly and sums back to the whole.
const income = 500000;
const parts = [40, 30, 15, 15].map((p) => allocationFor(p, income));
assert.deepEqual(parts, [200000, 150000, 75000, 75000]);
assert.equal(parts.reduce((a, b) => a + b, 0), income);

// deriveMonth: kept = earned − spent.
const d = deriveMonth(
  [{ key: "bills", name: "Bills + Savings", pct: 40, color: "", sort: 1 }],
  [{ id: "1", entry_date: "2026-09-01", ym: "2026-09", source_name: "NTC", category: "NTC", amount: 500000, note: null, created_at: "" }],
  [{ id: "2", entry_date: "2026-09-02", ym: "2026-09", bucket_key: "bills", category: "Rent", amount: 46000, note: null, created_at: "" }],
);
assert.equal(d.earned, 500000);
assert.equal(d.spent, 46000);
assert.equal(d.kept, 454000);

console.log("logic.check.mts: all assertions passed");
