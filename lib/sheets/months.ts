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

// "March 2025" -> "2025-03"; "Sept 2024" -> "2024-09"; returns null for non-month tabs.
export function parseTabToYm(title: string): string | null {
  const m = title.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const mon = ALIASES[m[1].toLowerCase()];
  if (!mon) return null;
  return `${m[2]}-${String(mon).padStart(2, "0")}`;
}

// "2026-09" -> "Sept 2026" (canonical style for a tab we create).
export function ymToTabTitle(ym: string): string {
  const [y, mo] = ym.split("-").map(Number);
  return `${CANONICAL[mo - 1]} ${y}`;
}
