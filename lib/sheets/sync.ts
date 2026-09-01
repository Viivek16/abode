// App -> Sheet: mirror a month's income into its tab. Supabase is the truth;
// this writes each source's total into the matching pre-named row's Income cell
// (col C) and lets the sheet's own formulas recompute quota/net/profits.
import {
  duplicateTab,
  getTabs,
  getValues,
  insertRowAfter,
  renameTab,
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
  { dryRun = false, tabTitle }: { dryRun?: boolean; tabTitle?: string } = {},
): Promise<PushResult> {
  const tabs = await getTabs();
  const byYm = new Map<string, TabMeta>();
  for (const t of tabs) {
    const y = parseTabToYm(t.title);
    if (y) byYm.set(y, t);
  }

  // A custom name only applies when it still parses to this same month, so tab
  // <-> month lookups keep working ("SEPT 2025" is fine, "Notes" is ignored).
  const desiredTitle =
    tabTitle && parseTabToYm(tabTitle) === ym ? tabTitle.trim() : ymToTabTitle(ym);

  let tab = byYm.get(ym) ?? null;
  let created = false;
  if (!tab) {
    created = true;
    const latest = [...byYm.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))[0];
    if (!latest) throw new Error("No monthly tab to use as a template");
    if (dryRun) {
      // Can't read a tab that doesn't exist yet; report intent only.
      return {
        tab: `${desiredTitle} (new, cloned from ${latest[1].title})`,
        created,
        writes: Object.entries(bySource).map(([s, amount]) => ({
          label: sheetLabel(s),
          row: 0,
          amount,
        })),
      };
    }
    tab = await duplicateTab(latest[1].sheetId, desiredTitle);
  } else if (!dryRun && desiredTitle !== tab.title) {
    // Existing tab, owner asked for a different name: rename in place.
    await renameTab(tab.sheetId, desiredTitle);
    tab = { ...tab, title: desiredTitle };
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

// App -> Sheet: mirror the notepad's Big Buys into the Balance Sheet tab's
// "Big Buys" table (columns Type | Date | Amount, e.g. H/I/J). Located by the
// "Big Buys" title cell so we never hardcode positions; writes only those three
// columns (no row inserts) so the Studio/Lending tables sharing those rows are
// left untouched.
export type BigBuy = { name: string; date?: string; amount: number };

export async function pushBigBuys(
  items: BigBuy[],
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<{ ok: boolean; reason?: string; tab?: string; written?: number }> {
  const tabs = await getTabs();
  const tab = tabs.find((t) => t.title.trim().toLowerCase() === "balance sheet");
  if (!tab) return { ok: false, reason: "no Balance Sheet tab" };

  const rows = await getValues(`${tab.title}!A1:J80`);
  let ti = -1;
  let cj = -1;
  for (let i = 0; i < rows.length && ti === -1; i++) {
    const r = rows[i] ?? [];
    for (let j = 0; j < r.length; j++) {
      if ((r[j] ?? "").toString().trim().toLowerCase() === "big buys") {
        ti = i;
        cj = j;
        break;
      }
    }
  }
  if (ti === -1) return { ok: false, reason: "no Big Buys table found" };

  const dataStart0 = ti + 2; // title row, header row, then data
  let oldTotal0 = -1;
  for (let i = dataStart0; i < rows.length; i++) {
    if ((rows[i]?.[cj] ?? "").toString().trim().toLowerCase() === "total") {
      oldTotal0 = i;
      break;
    }
  }

  const sum = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const oldSpan = oldTotal0 === -1 ? items.length + 1 : oldTotal0 - dataStart0 + 1;
  const span = Math.min(Math.max(items.length + 1, oldSpan), 60);

  const matrix: (string | number)[][] = [];
  for (let k = 0; k < span; k++) {
    if (k < items.length) matrix.push([items[k].name ?? "", items[k].date ?? "", Number(items[k].amount) || 0]);
    else if (k === items.length) matrix.push(["Total", "", sum]);
    else matrix.push(["", "", ""]);
  }

  const colName = String.fromCharCode(65 + cj);
  const colAmt = String.fromCharCode(65 + cj + 2);
  const startRow1 = dataStart0 + 1;
  const endRow1 = dataStart0 + span;
  if (!dryRun) await updateValues(`${tab.title}!${colName}${startRow1}:${colAmt}${endRow1}`, matrix);
  return { ok: true, tab: tab.title, written: items.length };
}

// Normalize a pot name for fuzzy matching ("Crypto (Mudrex)" ~ "Crypto",
// "Mutual Funds\n(Ketan Sheth)" ~ "Mutual Funds").
const normPot = (s: string) =>
  s.toLowerCase().replace(/\n/g, " ").replace(/\(.*?\)/g, "").trim();

export type TransferWrite = { pot: string; row: number; amount: number };

// Push a month's transfers (sum per pot) into the tab's "Transfered to" table.
export async function pushMonthTransfers(
  ym: string,
  byPot: Record<string, number>,
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<{ tab: string; writes: TransferWrite[] }> {
  const tabs = await getTabs();
  const byYm = new Map<string, TabMeta>();
  for (const t of tabs) {
    const y = parseTabToYm(t.title);
    if (y) byYm.set(y, t);
  }

  let tab = byYm.get(ym) ?? null;
  if (!tab) {
    const latest = [...byYm.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))[0];
    if (!latest) throw new Error("No monthly tab to use as a template");
    if (dryRun) return { tab: `${ymToTabTitle(ym)} (new)`, writes: [] };
    tab = await duplicateTab(latest[1].sheetId, ymToTabTitle(ym));
  }

  const rows = await getValues(`${tab.title}!A1:D40`);
  const hdr = rows.findIndex((r) =>
    (r[0] ?? "").toString().trim().toLowerCase().startsWith("transfered to"),
  );
  if (hdr === -1) throw new Error("No 'Transfered to' section in tab");

  const writes: TransferWrite[] = [];
  for (const [pot, amount] of Object.entries(byPot)) {
    const target = normPot(pot);
    let row = -1;
    for (let i = hdr + 1; i < rows.length; i++) {
      const a = (rows[i]?.[0] ?? "").toString();
      if (!a.trim()) break; // blank row ends the table
      const n = normPot(a);
      if (n.includes(target) || target.includes(n)) {
        row = i + 1;
        break;
      }
    }
    if (row === -1) continue; // no matching sheet row
    writes.push({ pot, row, amount });
    if (!dryRun) await updateValues(`${tab.title}!B${row}`, [[amount]]);
  }
  return { tab: tab.title, writes };
}
