"use client";

import { useQuery } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ymLabel } from "@/lib/logic";

const supabase = supabaseBrowser();

export type Tier = {
  key: string;
  name: string;
  blurb: string;
  color: string; // css var
};

// A behavioural badge derived from how the user actually allocates income.
// invest / save / spend are shares of total income (0..1).
export function computeTier(
  income: number,
  invest: number,
  save: number,
  spend: number,
): Tier {
  const iShare = income > 0 ? invest / income : 0;
  const sShare = income > 0 ? save / income : 0;
  const pShare = income > 0 ? spend / income : 0;

  if (income <= 0)
    return { key: "builder", name: "The Builder", blurb: "Just getting started. Log your first income to earn a badge.", color: "var(--accent-soft)" };
  if (iShare >= 0.25 && pShare <= 0.3)
    return { key: "strategist", name: "The Strategist", blurb: "Invests hard, spends light. Textbook money discipline.", color: "var(--accent)" };
  if (sShare >= 0.3)
    return { key: "saver", name: "The Saver", blurb: "A believer in the safety net. Savings come first.", color: "var(--bucket-bills)" };
  if (iShare < 0.05 && pShare >= 0.4)
    return { key: "spender", name: "The Free Spirit", blurb: "Lives for today. Money comes in, money goes out.", color: "var(--negative)" };
  if (iShare < 0.05)
    return { key: "risk-taker", name: "The Risk-Taker", blurb: "Not investing yet. Future you would like a word.", color: "var(--bucket-emergency)" };
  return { key: "builder", name: "The Builder", blurb: "Finding the balance across saving, investing and living.", color: "var(--accent-soft)" };
}

export type Profile = {
  name: string;
  email: string;
  avatar: string | null;
  userSince: string | null;
  financeSince: string | null;
  income: number;
  invest: number;
  save: number;
  spend: number;
  tier: Tier;
};

const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile> => {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      const meta = (user?.user_metadata ?? {}) as Record<string, string>;
      const email = user?.email ?? "";

      const [inc, tr, exp] = await Promise.all([
        supabase.from("income_entries").select("ym, amount"),
        supabase.from("transfers").select("quota_key, amount"),
        supabase.from("expense_entries").select("amount"),
      ]);

      const incomeRows = inc.data ?? [];
      const income = incomeRows.reduce((s, r) => s + Number(r.amount), 0);
      const months = [...new Set(incomeRows.map((r) => r.ym as string))].sort();
      const invest = (tr.data ?? [])
        .filter((r) => r.quota_key === "invest")
        .reduce((s, r) => s + Number(r.amount), 0);
      const save = (tr.data ?? [])
        .filter((r) => r.quota_key === "bills")
        .reduce((s, r) => s + Number(r.amount), 0);
      const spend = (exp.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

      return {
        name: meta.full_name || meta.name || email.split("@")[0] || "You",
        email,
        avatar: meta.avatar_url || meta.picture || null,
        userSince: user?.created_at ? monthYear(user.created_at) : null,
        financeSince: months.length ? ymLabel(months[0]) : null,
        income,
        invest,
        save,
        spend,
        tier: computeTier(income, invest, save, spend),
      };
    },
  });
}
