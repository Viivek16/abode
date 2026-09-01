"use client";

import { useQuery } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase/client";

const supabase = supabaseBrowser();

// True only for the owner (the one account with a linked Google Sheet). Used to
// gate sheet-only UI such as naming a month's sheet tab. Set
// NEXT_PUBLIC_OWNER_EMAIL to the owner address; if unset, nobody is the owner
// client-side and the sheet UI stays hidden (safe default).
export function useIsOwner() {
  const owner = (process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "").trim().toLowerCase();
  return useQuery({
    queryKey: ["is-owner"],
    queryFn: async () => {
      if (!owner) return false;
      const { data } = await supabase.auth.getUser();
      return (data.user?.email ?? "").toLowerCase() === owner;
    },
    staleTime: Infinity,
  });
}
