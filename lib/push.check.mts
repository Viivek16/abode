// Runnable self-check for the reminder schedule. Run: node lib/push.check.mts

import assert from "node:assert/strict";
import { dayInfo, reminderForDay } from "./push.ts";

// Trigger days carry a message; personalisation + fallback name.
assert.equal(reminderForDay(1, 31, "Vivek")?.title, "A fresh month begins");
assert.match(reminderForDay(1, 31, "Vivek")!.body, /^Hey Vivek/);
assert.equal(reminderForDay(10, 31, "")?.title, "Ten days in");
assert.match(reminderForDay(10, 31, "")!.body, /^Hey there/); // blank name → "there"
assert.equal(reminderForDay(20, 31, "Vivek")?.title, "Two-thirds through");
assert.equal(reminderForDay(31, 31, "Vivek")?.title, "Month in review"); // last day (31)
assert.equal(reminderForDay(28, 28, "Vivek")?.title, "Month in review"); // last day (Feb)

// Non-trigger days are silent.
assert.equal(reminderForDay(15, 31, "Vivek"), null);
assert.equal(reminderForDay(30, 31, "Vivek"), null); // 30 is not the last day of a 31-day month

// dayInfo reads the calendar day in the target zone (10:00 IST on Feb 15 2026).
const info = dayInfo(new Date("2026-02-15T04:30:00Z"), "Asia/Kolkata");
assert.equal(info.day, 15);
assert.equal(info.lastDay, 28); // 2026 is not a leap year

console.log("push.check.mts: all assertions passed");
