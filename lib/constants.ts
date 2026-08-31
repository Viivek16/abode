import type { BucketKey } from "./types";

// Expense category chips → quota bucket.
export const EXPENSE_CATEGORIES: { label: string; bucket: BucketKey }[] = [
  { label: "Rent / EMI", bucket: "bills" },
  { label: "Bills", bucket: "bills" },
  { label: "Groceries", bucket: "bills" },
  { label: "Investment", bucket: "invest" },
  { label: "Emergency", bucket: "emergency" },
  { label: "Vacation", bucket: "emergency" },
  { label: "Dining", bucket: "personal" },
  { label: "Shopping", bucket: "personal" },
  { label: "Transport", bucket: "personal" },
  { label: "Other", bucket: "personal" },
];

// Income source tags. "Other" (last) reveals a free-text field for any source
// not listed here.
export const INCOME_SOURCES = ["NTC", "Yellow", "Freelancing", "Other"] as const;

// CSS variable per bucket, for inline SVG / dynamic styling.
export const bucketVar = (key: BucketKey) => `var(--bucket-${key})`;
