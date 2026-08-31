import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { pushMonthTransfers } from "@/lib/sheets/sync";

// App -> Sheet. After allocating, mirror the month's transfers (sum per pot)
// into the tab's "Transfered to" table.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if ((user.email ?? "").toLowerCase() !== admin)
    return NextResponse.json({ ok: true, skipped: "not owner" });

  const body = (await req.json().catch(() => ({}))) as { ym?: string; dryRun?: boolean };
  if (!/^\d{4}-\d{2}$/.test(body.ym ?? ""))
    return NextResponse.json({ error: "bad ym" }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("transfers")
    .select("amount, pots(name)")
    .eq("ym", body.ym)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byPot: Record<string, number> = {};
  for (const r of (data ?? []) as { amount: number; pots: { name: string } | { name: string }[] | null }[]) {
    const pot = Array.isArray(r.pots) ? r.pots[0] : r.pots;
    if (!pot?.name) continue;
    byPot[pot.name] = (byPot[pot.name] ?? 0) + Number(r.amount);
  }

  try {
    const result = await pushMonthTransfers(body.ym!, byPot, { dryRun: !!body.dryRun });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
