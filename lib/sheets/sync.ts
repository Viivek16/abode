// App -> Sheet: mirror a month's income into its tab. Supabase is the truth;
// this writes each source's total into the matching pre-named row's Income cell
// (col C) and lets the sheet's own formulas recompute quota/net/profits.
import {
  duplicateTab,
  getTabs,
  getValues,
  insertRowAfter,
  updateValues,
  type TabMeta,
} from "./client";
import { parseTabToYm, ymToTabTitle } from "./months";

// App source chip -> the sheet's pre-named row label.
const SOURCE_TO_SHEET: Record<string, string> = {
  NTC: "NTC Salary",
  Yellow: "Yellow Salary",
  Freelancing: "Freelancing",
};
export const sheetLabel = (source: string) => SOURCE_TO_SHEET[source] ?? source;

const LEDGER_RANGE = (title: string) => `${title}!A1:E40`;

export type PushWrite = {
  label: string;
  row: number;
  amount: number;
  inserted?: boolean;
};
export type PushResult = {
  tab: string;
  created: boolean;
  writes: PushWrite[];
};

// Push all income for `ym` (sum per source) into the sheet. dryRun reports the
// planned writes without touching the sheet.
export async function pushMonthIncome(
  ym: string,
  bySource: Record<string, number>,
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<PushResult> {
  const tabs = await getTabs();
  const byYm = new Map<string, TabMeta>();
  for (const t of tabs) {
    const y = parseTabToYm(t.title);
    if (y) byYm.set(y, t);
  }

  let tab = byYm.get(ym) ?? null;
  let created = false;
  if (!tab) {
    created = true;
    const latest = [...byYm.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))[0];
    if (!latest) throw new Error("No monthly tab to use as a template");
    if (dryRun) {
      // Can't read a tab that doesn't exist yet; report intent only.
      return {
        tab: `${ymToTabTitle(ym)} (new, cloned from ${latest[1].title})`,
        created,
        writes: Object.entries(bySource).map(([s, amount]) => ({
          label: sheetLabel(s),
          row: 0,
          amount,
        })),
      };
    }
    tab = await duplicateTab(latest[1].sheetId, ymToTabTitle(ym));
  }

  let rows = await getValues(LEDGER_RANGE(tab.title));
  const cell = (r: number, c: number) => (rows[r]?.[c] ?? "").toString().trim();
  const ledgerEnd = () => {
    const i = rows.findIndex((r) => (r[0] ?? "").toString().trim().toLowerCase() === "net");
    return i === -1 ? rows.length : i;
  };
  const lastSalaryRow = () => {
    let x = 1;
    const end = ledgerEnd();
    for (let i = 1; i < end; i++) if (cell(i, 1).toLowerCase() === "salary") x = i + 1;
    return x; // 1-based
  };
  const findLabel = (label: string) => {
    const end = ledgerEnd();
    for (let i = 1; i < end; i++)
      if (cell(i, 0).toLowerCase() === label.toLowerCase()) return i + 1; // 1-based
    return -1;
  };

  // A freshly cloned tab carries the template's income values — clear them first.
  if (created) {
    const end = ledgerEnd();
    for (let i = 1; i < end; i++)
      if (cell(i, 1).toLowerCase() === "salary")
        await updateValues(`${tab.title}!C${i + 1}`, [[""]]);
  }

  const writes: PushWrite[] = [];
  for (const [source, amount] of Object.entries(bySource)) {
    const label = sheetLabel(source);
    const row = findLabel(label);
    if (row !== -1) {
      writes.push({ label, row, amount });
      if (!dryRun) await updateValues(`${tab.title}!C${row}`, [[amount]]);
    } else {
      // Custom source with no pre-named row: insert one after the last income row.
      const at = lastSalaryRow();
      const newRow = at + 1;
      writes.push({ label, row: newRow, amount, inserted: true });
      if (!dryRun) {
        await insertRowAfter(tab.sheetId, at);
        await updateValues(`${tab.title}!A${newRow}:C${newRow}`, [[label, "Salary", amount]]);
        rows = await getValues(LEDGER_RANGE(tab.title)); // refresh after structural change
      }
    }
  }
  return { tab: tab.title, created, writes };
}
