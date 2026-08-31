/**
 * Abode — Sheet → App sync.
 *
 * Setup (one time):
 *  1. Open the sheet → Extensions → Apps Script.
 *  2. Paste this file in, replacing Code.gs.
 *  3. Set APP_URL to your deployed app's /api/sheet/pull endpoint
 *     (for local testing, expose localhost with a tunnel like ngrok and use that URL).
 *  4. Set SECRET to the exact same value as SHEET_SYNC_SECRET in .env.local.
 *  5. Triggers (clock icon, left sidebar) → Add Trigger:
 *        function: onSheetEdit
 *        event source: From spreadsheet
 *        event type: On edit
 *     Save, then authorize when prompted (it's your own script — proceed past the
 *     "unverified" screen).
 *
 * After this, editing an income cell (column C) on any monthly tab pushes that
 * value into the app. Expenses are intentionally ignored for now.
 */
const APP_URL = "https://YOUR-APP.vercel.app/api/sheet/pull";
const SECRET = "PASTE_SAME_VALUE_AS_SHEET_SYNC_SECRET";

function onSheetEdit(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const col = e.range.getColumn();

  if (col !== 3 || row < 2) return; // only the Income column (C), data rows

  const label = sheet.getRange(row, 1).getValue();    // A: source name
  const category = sheet.getRange(row, 2).getValue();  // B: category
  if (String(category).trim().toLowerCase() !== "salary") return; // income rows only

  const amount = sheet.getRange(row, 3).getValue();    // C: income amount

  UrlFetchApp.fetch(APP_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      secret: SECRET,
      tab: sheet.getName(),
      label: label,
      amount: amount,
    }),
    muteHttpExceptions: true,
  });
}
