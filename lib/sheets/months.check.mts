// Runnable self-check for the irregular tab-name parsing/formatting.
// Run:  node lib/sheets/months.check.mts
import assert from "node:assert/strict";
import { parseTabToYm, ymToTabTitle } from "./months.ts";

// Parse the real spellings seen in the sheet.
assert.equal(parseTabToYm("Mar 2024"), "2024-03");
assert.equal(parseTabToYm("March 2025"), "2025-03");
assert.equal(parseTabToYm("Sept 2024"), "2024-09");
assert.equal(parseTabToYm("April 2024"), "2024-04");
assert.equal(parseTabToYm("July 2026"), "2026-07");
assert.equal(parseTabToYm("Jan 2026"), "2026-01");
assert.equal(parseTabToYm("Balance Sheet"), null);
assert.equal(parseTabToYm("Nonsense"), null);

// Owner-typed custom names still map to their month (month word + trailing year).
assert.equal(parseTabToYm("SEPT SUBT 2026"), "2026-09");
assert.equal(parseTabToYm("AUG 2026"), "2026-08");
assert.equal(parseTabToYm("June salary 2025"), "2025-06");

// New tabs use the recent canonical style.
assert.equal(ymToTabTitle("2026-09"), "Sept 2026");
assert.equal(ymToTabTitle("2026-08"), "Aug 2026");
assert.equal(ymToTabTitle("2026-03"), "March 2026");
assert.equal(ymToTabTitle("2026-12"), "Dec 2026");

// Round-trip: a canonical title parses back to its ym.
for (const ym of ["2026-01", "2026-06", "2026-09", "2026-12"])
  assert.equal(parseTabToYm(ymToTabTitle(ym)), ym);

console.log("months.check.mts: all assertions passed");
