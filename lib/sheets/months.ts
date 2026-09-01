// Month <-> tab-title helpers for the Google Sheet, whose tab names are
// hand-typed and irregular ("Mar 2024" vs "March 2025", "Sept", "April").

// Canonical titles for NEW tabs, matching the sheet's recent (2025/2026) style.
const CANONICAL = [
  "Jan", "Feb", "March", "April", "May", "June",
  "July", "Aug", "Sept", "Oct", "Nov", "Dec",
];

// Lenient spelling -> month number, covering every variant seen in the sheet.
const ALIASES: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, sep: 9, sept: 9,
  oct: 10, nov: 11, dec: 12,
};

// "March 2025" -> "2025-03"; "Sept 2024" -> "2024-09". Also tolerates custom
// names as long as they start with a month word and end with a 4-digit year, so
// owner-typed tabs like "SEPT SUBT 2026" still map back to their month. Returns
// null for non-month tabs ("Balance Sheet", "Nonsense").
export function parseTabToYm(title: string): string | null {
  const t = title.trim();
  const first = t.match(/^([A-Za-z]+)/);
  const year = t.match(/(\d{4})\s*$/);
  if (!first || !year) return null;
  const mon = ALIASES[first[1].toLowerCase()];
  if (!mon) return null;
  return `${year[1]}-${String(mon).padStart(2, "0")}`;
}

// "2026-09" -> "Sept 2026" (canonical style for a tab we create).
export function ymToTabTitle(ym: string): string {
  const [y, mo] = ym.split("-").map(Number);
  return `${CANONICAL[mo - 1]} ${y}`;
}
