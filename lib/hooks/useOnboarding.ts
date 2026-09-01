"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase/client";
import { currentYm, dateForYm } from "@/lib/logic";

const supabase = supabaseBrowser();

// A user needs onboarding when they have no custom split yet AND no income
// history. This keeps the established owner (income, no user_quota rows) and any
// returning friend (has user_quota rows) out of the flow, while a brand-new
// friend lands in it.
export function useNeedsOnboarding() {
  return useQuery({
    queryKey: ["needs-onboarding"],
    queryFn: async () => {
      const [uq, inc] = await Promise.all([
        supabase.from("user_quota").select("key", { count: "exact", head: true }),
        supabase.from("income_entries").select("id", { count: "exact", head: true }),
      ]);
      if (uq.error) throw uq.error;
      if (inc.error) throw inc.error;
      return (uq.count ?? 0) === 0 && (inc.count ?? 0) === 0;
    },
    staleTime: 60_000,
  });
}

export type Split = {
  bills: number;
  invest: number;
  emergency: number;
  personal: number;
};

export type FixedExpense = { label: string; amount: number };

// Persist the chosen split, seed starter pots, and log the user's fixed
// expenses for the current month (as bills, so they show up in Spent), then
// unblock the dashboard.
export function useFinishOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ split, fixed }: { split: Split; fixed: FixedExpense[] }) => {
      const { error } = await supabase.rpc("set_user_quota", {
        p_bills: split.bills,
        p_invest: split.invest,
        p_emergency: split.emergency,
        p_personal: split.personal,
      });
      if (error) throw error;
      await supabase.rpc("ensure_default_pots"); // no-op if pots already exist

      const p_date = dateForYm(currentYm());
      for (const f of fixed) {
        if (f.amount <= 0 || !f.label.trim()) continue;
        const { error: exErr } = await supabase.rpc("add_expense", {
          p_amount: f.amount,
          p_bucket: "bills",
          p_category: f.label.trim(),
          p_note: "Fixed expense",
          p_date,
        });
        if (exErr) throw exErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["needs-onboarding"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["monthly-totals"] });
      qc.invalidateQueries({ queryKey: ["income-months"] });
    },
  });
}
