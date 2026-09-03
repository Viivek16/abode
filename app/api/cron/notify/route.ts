import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dayInfo, reminderForDay } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reminders are scheduled at 10:00 in this zone (the daily cron runs 04:30 UTC).
const TZ = "Asia/Kolkata";

export async function GET(req: Request) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the env var is
  // set — require it so the endpoint can't be triggered by anyone.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@abode.app";
  if (!publicKey || !privateKey)
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const { day, lastDay } = dayInfo(new Date(), TZ);
  // Most days have no reminder — return early so the daily run is cheap.
  if (!reminderForDay(day, lastDay, "there"))
    return NextResponse.json({ ok: true, skipped: `day ${day}` });

  const admin = supabaseAdmin();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, first_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  let pruned = 0;
  await Promise.all(
    (subs ?? []).map(async (s) => {
      const msg = reminderForDay(day, lastDay, s.first_name ?? "there");
      if (!msg) return;
      const payload = JSON.stringify({ title: msg.title, body: msg.body, url: "/", tag: "abode-reminder" });
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (err) {
        // 404/410 mean the subscription is dead — drop it so we stop retrying.
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          pruned++;
        }
      }
    }),
  );

  return NextResponse.json({ ok: true, day, sent, pruned });
}
