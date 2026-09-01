import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { pushBigBuys, type BigBuy } from "@/lib/sheets/sync";

// App -> Sheet. Mirrors the owner's notepad Big Buys into the Balance Sheet.
// Owner-only; friends have no sheet, so this is a no-op for them.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if ((user.email ?? "").toLowerCase() !== admin)
    return NextResponse.json({ ok: true, skipped: "not owner" });

  const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean };

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("notepad")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data?.data?.big_buys?.items ?? []) as BigBuy[];
  try {
    const result = await pushBigBuys(items, { dryRun: !!body.dryRun });
    return NextResponse.json({ ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
