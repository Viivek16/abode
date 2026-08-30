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

// Income source tags (Section 1).
export const INCOME_CATEGORIES = ["Salary", "Bills", "Investments", "Personal"] as const;

// CSS variable per bucket, for inline SVG / dynamic styling.
export const bucketVar = (key: BucketKey) => `var(--bucket-${key})`;
