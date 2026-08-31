import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseTabToYm } from "@/lib/sheets/months";

// Sheet -> app. Called by the sheet's Apps Script when an income cell is edited.
// Makes Supabase match the sheet: the cell value is the authoritative total for
// (month, source), replacing that source's entries for the month.
const SHEET_TO_SOURCE: Record<string, string> = {
  "NTC Salary": "NTC",
  "Yellow Salary": "Yellow",
  Freelancing: "Freelancing",
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    secret?: string;
    tab?: string;
    label?: string;
    amount?: number | string;
  };
  if (!body.secret || body.secret !== process.env.SHEET_SYNC_SECRET)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const ym = parseTabToYm(String(body.tab ?? ""));
  if (!ym) return NextResponse.json({ error: "unknown tab" }, { status: 400 });

  const label = String(body.label ?? "").trim();
  const source = SHEET_TO_SOURCE[label] ?? label;
  if (!source) return NextResponse.json({ error: "no source" }, { status: 400 });
  const amount = Number(body.amount) || 0;

  const db = supabaseAdmin();

  // The sheet belongs to the owner — write into the owner's account.
  const { data: list } = await db.auth.admin.listUsers();
  const ownerId = list?.users.find(
    (u) => (u.email ?? "").toLowerCase() === (process.env.ADMIN_EMAIL ?? "").toLowerCase(),
  )?.id;
  if (!ownerId)
    return NextResponse.json({ error: "owner not found" }, { status: 500 });

  const del = await db
    .from("income_entries")
    .delete()
    .eq("ym", ym)
    .eq("source_name", source)
    .eq("user_id", ownerId);
  if (del.error)
    return NextResponse.json({ error: del.error.message }, { status: 500 });

  if (amount > 0) {
    const ins = await db.from("income_entries").insert({
      user_id: ownerId,
      entry_date: `${ym}-01`,
      ym,
      source_name: source,
      category: "Salary",
      amount,
    });
    if (ins.error)
      return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ym, source, amount });
}
