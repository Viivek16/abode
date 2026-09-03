// Monthly reminder schedule — pure so it's testable and shared by the cron and
// the client. Reminders fire on the 1st, 10th, 20th and the last day of a month.

export type PushMessage = { title: string; body: string };

export function reminderForDay(
  day: number,
  lastDay: number,
  firstName: string,
): PushMessage | null {
  const name = (firstName || "").trim() || "there";
  if (day === 1)
    return {
      title: "A fresh month begins",
      body: `Hey ${name} — log this month's income and expenses. Discipline is the only way forward.`,
    };
  if (day === 10)
    return {
      title: "Ten days in",
      body: `Hey ${name}, how's the budget holding up? Take a minute to check in on your pots.`,
    };
  if (day === 20)
    return {
      title: "Two-thirds through",
      body: `Hey ${name}, quick pulse check — are you still on track for the month?`,
    };
  if (day === lastDay)
    return {
      title: "Month in review",
      body: `Hey ${name}, take a peek at where this month's money went before it wraps up.`,
    };
  return null;
}

// The day-of-month and last-day-of-month for `date`, read in the given IANA
// time zone (so "the 1st at 10am" means the user's local calendar day).
export function dayInfo(date: Date, timeZone: string): { day: number; lastDay: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const y = get("year");
  const m = get("month"); // 1-based
  const day = get("day");
  // Day 0 of the following month is the last day of this one.
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { day, lastDay };
}
