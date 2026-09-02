export type BucketKey = "bills" | "invest" | "emergency" | "personal";

export type QuotaConfig = {
  key: BucketKey;
  name: string;
  pct: number;
  color: string;
  sort: number;
};

export type Pot = {
  id: string;
  key: string;
  name: string;
  bucket_key: BucketKey | null;
  color: string | null;
  icon: string | null;
  is_bank: boolean;
  current_balance: number;
  created_at: string;
};

export type IncomeEntry = {
  id: string;
  entry_date: string;
  ym: string;
  source_name: string;
  category: string | null;
  amount: number;
  note: string | null;
  created_at: string;
};

export type ExpenseEntry = {
  id: string;
  entry_date: string;
  ym: string;
  bucket_key: BucketKey | null;
  category: string | null;
  amount: number;
  note: string | null;
  created_at: string;
};

export type Transfer = {
  id: string;
  entry_date: string;
  ym: string;
  pot_id: string | null;
  quota_key: BucketKey | null;
  amount: number;
  created_at: string;
};

export type PotSnapshot = {
  pot_id: string;
  ym: string;
  balance: number;
};

// Derived per-bucket view used by the rings + legend.
export type BucketView = {
  key: BucketKey;
  name: string;
  color: string;
  allocated: number; // quota target = pct * income
  spent: number; // expenses filed to this bucket
  moved: number; // allocated into pots under this bucket this month
  fill: number; // 0..1 (moved / allocated)
  over: boolean; // moved > allocated
};
