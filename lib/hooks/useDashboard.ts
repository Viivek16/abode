"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { dateForYm, shiftYm } from "@/lib/logic";
import type {
  ExpenseEntry,
  IncomeEntry,
  Pot,
  QuotaConfig,
  Transfer,
} from "@/lib/types";

// One browser client for the whole tab.
const supabase = supabaseBrowser();

export type DashboardData = {
  pots: Pot[];
  quota: QuotaConfig[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  transfers: Transfer[];
  prevNetWorth: number | null;
};

const key = (ym: string) => ["dashboard", ym] as const;

async function fetchDashboard(ym: string): Promise<DashboardData> {
  const prevYm = shiftYm(ym, -1);
  const [pots, quota, income, expenses, transfers, prevSnap] = await Promise.all([
    supabase.from("pots").select("*").order("is_bank", { ascending: false }).order("name"),
    supabase.from("quota_config").select("*").order("sort"),
    supabase.from("income_entries").select("*").eq("ym", ym),
    supabase.from("expense_entries").select("*").eq("ym", ym).order("created_at", { ascending: false }),
    supabase.from("transfers").select("*").eq("ym", ym),
    supabase.from("pot_snapshots").select("balance").eq("ym", prevYm),
  ]);

  const err =
    pots.error || quota.error || income.error || expenses.error || transfers.error;
  if (err) throw err;

  const prevRows = prevSnap.data ?? [];
  const prevNetWorth = prevRows.length
    ? prevRows.reduce((s, r) => s + Number(r.balance), 0)
    : null;

  return {
    pots: (pots.data ?? []) as Pot[],
    quota: (quota.data ?? []) as QuotaConfig[],
    income: (income.data ?? []) as IncomeEntry[],
    expenses: (expenses.data ?? []) as ExpenseEntry[],
    transfers: (transfers.data ?? []) as Transfer[],
    prevNetWorth,
  };
}

export function useDashboardData(ym: string) {
  return useQuery({
    queryKey: key(ym),
    queryFn: () => fetchDashboard(ym),
  });
}

// Distinct months that actually have income, newest last. Used to land on the
// latest populated month instead of an empty current month.
export function useIncomeMonths() {
  return useQuery({
    queryKey: ["income-months"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_entries")
        .select("ym")
        .order("ym");
      if (error) throw error;
      return [...new Set((data ?? []).map((r) => r.ym as string))].sort();
    },
  });
}

// Total income per month across all history, for the income heatmap.
export function useMonthlyIncome() {
  return useQuery({
    queryKey: ["monthly-income"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_entries")
        .select("ym, amount");
      if (error) throw error;
      const by = new Map<string, number>();
      for (const r of data ?? [])
        by.set(r.ym as string, (by.get(r.ym as string) ?? 0) + Number(r.amount));
      return [...by.entries()]
        .map(([ym, value]) => ({ ym, value }))
        .sort((a, b) => (a.ym < b.ym ? -1 : 1));
    },
  });
}

// Invalidate the current month whenever the data changes on any device.
export function useRealtime(ym: string) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("abode-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "expense_entries" }, () =>
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "income_entries" }, () =>
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "pots" }, () =>
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "transfers" }, () =>
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, ym]);
}

export type NewEntry = {
  kind: "expense" | "income";
  amount: number;
  bucket?: string; // expense
  category?: string;
  source?: string; // income
  note?: string;
  ym?: string; // target month; defaults to the displayed month (backdating)
};

export function useAddEntry(ym: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (e: NewEntry) => {
      const p_date = dateForYm(e.ym ?? ym);
      if (e.kind === "expense") {
        const { error } = await supabase.rpc("add_expense", {
          p_amount: e.amount,
          p_bucket: e.bucket,
          p_category: e.category ?? null,
          p_note: e.note ?? null,
          p_date,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc("add_income", {
          p_amount: e.amount,
          p_source: e.source ?? e.category ?? "Income",
          p_category: e.category ?? null,
          p_note: e.note ?? null,
          p_date,
        });
        if (error) throw error;
      }
    },

    // Optimistic: reflect the change immediately so numbers animate before the round-trip.
    // Only patch when the entry lands on the displayed month; a backdated entry
    // for another month just refreshes on settle.
    onMutate: async (e) => {
      if ((e.ym ?? ym) !== ym) return {};
      await qc.cancelQueries({ queryKey: key(ym) });
      const prev = qc.getQueryData<DashboardData>(key(ym));
      if (prev) {
        const now = new Date().toISOString();
        const bankDelta = e.kind === "income" ? e.amount : -e.amount;
        const next: DashboardData = {
          ...prev,
          pots: prev.pots.map((p) =>
            p.is_bank
              ? { ...p, current_balance: Number(p.current_balance) + bankDelta }
              : p,
          ),
          expenses:
            e.kind === "expense"
              ? [
                  {
                    id: `temp-${now}`,
                    entry_date: dateForYm(ym),
                    ym,
                    bucket_key: (e.bucket ?? null) as ExpenseEntry["bucket_key"],
                    category: e.category ?? null,
                    amount: e.amount,
                    note: e.note ?? null,
                    created_at: now,
                  },
                  ...prev.expenses,
                ]
              : prev.expenses,
          income:
            e.kind === "income"
              ? [
                  {
                    id: `temp-${now}`,
                    entry_date: dateForYm(ym),
                    ym,
                    source_name: e.source ?? e.category ?? "Income",
                    category: e.category ?? null,
                    amount: e.amount,
                    note: e.note ?? null,
                    created_at: now,
                  },
                  ...prev.income,
                ]
              : prev.income,
        };
        qc.setQueryData(key(ym), next);
      }
      return { prev };
    },

    onError: (_err, _e, ctx) => {
      if (ctx?.prev) qc.setQueryData(key(ym), ctx.prev);
    },

    // Mirror income into the Google Sheet (fire-and-forget; sheet lags the app).
    onSuccess: (_data, e) => {
      if (e.kind !== "income") return; // expenses: deferred to the next phase
      const targetYm = e.ym ?? ym;
      fetch("/api/sheet/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ym: targetYm }),
      }).catch(() => {});
    },

    onSettled: () => {
      // Refresh every cached month (the target may differ from the displayed one)
      // and the month list, so a backdated entry surfaces when switched to.
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["income-months"] });
    },
  });
}
