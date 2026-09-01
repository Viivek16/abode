import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { pushMonthIncome } from "@/lib/sheets/sync";

// App -> Sheet. Called after an income add (or with { dryRun:true } to preview).
// Recomputes the month's income from Supabase and mirrors it into the sheet tab.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Sheet sync is owner-only for now; friends' data never touches the sheet.
  const admin = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if ((user.email ?? "").toLowerCase() !== admin)
    return NextResponse.json({ ok: true, skipped: "not owner" });

  const body = (await req.json().catch(() => ({}))) as {
    ym?: string;
    dryRun?: boolean;
    tabTitle?: string;
  };
  if (!/^\d{4}-\d{2}$/.test(body.ym ?? ""))
    return NextResponse.json({ error: "bad ym" }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("income_entries")
    .select("source_name, amount")
    .eq("ym", body.ym)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bySource: Record<string, number> = {};
  for (const r of data ?? [])
    bySource[r.source_name] = (bySource[r.source_name] ?? 0) + Number(r.amount);

  try {
    const result = await pushMonthIncome(body.ym!, bySource, {
      dryRun: !!body.dryRun,
      tabTitle: body.tabTitle,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
