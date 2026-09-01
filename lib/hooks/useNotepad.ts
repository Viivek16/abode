"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase/client";

const supabase = supabaseBrowser();

export type FundManager = {
  name: string;
  type: string;
  platform: string;
  split: string;
  amount: number;
  date: string;
  maturity: string;
  returns: string;
};

export type LineItem = { name: string; date?: string; amount: number };

export type NotepadData = {
  fund_managers: FundManager[];
  big_buys: { total: number; items: LineItem[] };
  lending: { total: number; items: LineItem[] };
  studio: { total: number; items: LineItem[] };
};

export const emptyNotepad = (): NotepadData => ({
  fund_managers: [],
  big_buys: { total: 0, items: [] },
  lending: { total: 0, items: [] },
  studio: { total: 0, items: [] },
});

const sum = (items: LineItem[]) =>
  items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

// Recompute the section totals so they always match their rows.
export function withTotals(d: NotepadData): NotepadData {
  return {
    fund_managers: d.fund_managers,
    big_buys: { items: d.big_buys.items, total: sum(d.big_buys.items) },
    lending: { items: d.lending.items, total: sum(d.lending.items) },
    studio: { items: d.studio.items, total: sum(d.studio.items) },
  };
}

export function useNotepad() {
  return useQuery({
    queryKey: ["notepad"],
    queryFn: async (): Promise<NotepadData> => {
      const { data, error } = await supabase
        .from("notepad")
        .select("data")
        .maybeSingle();
      if (error) throw error;
      return { ...emptyNotepad(), ...((data?.data ?? {}) as Partial<NotepadData>) };
    },
  });
}

export function useSaveNotepad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: NotepadData) => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Not signed in");
      const clean = withTotals(data);
      const { error } = await supabase
        .from("notepad")
        .upsert({ user_id: uid, data: clean, updated_at: new Date().toISOString() });
      if (error) throw error;
      return clean;
    },
    onSuccess: (clean) => {
      qc.setQueryData(["notepad"], clean);
    },
  });
}
