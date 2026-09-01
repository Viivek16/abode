"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase/client";

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

// Persist the chosen split and seed starter pots, then unblock the dashboard.
export function useFinishOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Split) => {
      const { error } = await supabase.rpc("set_user_quota", {
        p_bills: s.bills,
        p_invest: s.invest,
        p_emergency: s.emergency,
        p_personal: s.personal,
      });
      if (error) throw error;
      await supabase.rpc("ensure_default_pots"); // no-op if pots already exist
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["needs-onboarding"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
