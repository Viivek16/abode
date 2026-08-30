"use client";

import { useQuery } from "@tanstack/react-query";
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

export type Upcoming = {
  fund_managers: FundManager[];
  big_buys: { total: number; items: LineItem[] };
  lending: { total: number; items: LineItem[] };
  studio: { total: number; items: LineItem[] };
};

export function useUpcoming() {
  return useQuery({
    queryKey: ["upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "upcoming")
        .single();
      if (error) throw error;
      return data.value as Upcoming;
    },
  });
}
