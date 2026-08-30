"use client";

import { useState } from "react";
import Link from "next/link";
import NetWorthHero from "@/components/hero/NetWorthHero";
import StatTrio from "@/components/stats/StatTrio";
import QuotaRings from "@/components/rings/QuotaRings";
import Flow from "@/components/flow/Flow";
import PotCards from "@/components/pots/PotCards";
import MonthSwitcher from "@/components/month-switcher/MonthSwitcher";
import UpcomingStrip from "@/components/upcoming/UpcomingStrip";
import QuickAdd from "@/components/quick-add/QuickAdd";
import Toast from "@/components/ui/Toast";
import {
  useAddEntry,
  useDashboardData,
  useIncomeMonths,
  useRealtime,
  type NewEntry,
} from "@/lib/hooks/useDashboard";
import { currentYm, deriveMonth, netWorth, shiftYm } from "@/lib/logic";
import type { BucketKey } from "@/lib/types";

export default function Dashboard() {
  const [picked, setPicked] = useState<string | null>(null);
  const [selected, setSelected] = useState<BucketKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data: incomeMonths } = useIncomeMonths();
  // Default to the latest month that has income; an explicit pick takes over once made.
  const ym = picked ?? incomeMonths?.[incomeMonths.length - 1] ?? currentYm();

  const { data } = useDashboardData(ym);
  useRealtime(ym);
  const addEntry = useAddEntry(ym);

  const quota = data?.quota ?? [];
  const income = data?.income ?? [];
  const expenses = data?.expenses ?? [];
  const pots = data?.pots ?? [];
  const transfers = data?.transfers ?? [];

  const { earned, spent, kept, buckets } = deriveMonth(quota, income, expenses);
  const worth = netWorth(pots);

  async function onAdd(e: NewEntry) {
    await addEntry.mutateAsync(e);
    setToast(e.kind === "expense" ? "Expense added" : "Income added");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="font-display text-lg font-bold text-ink">Abode</p>
          <span className="text-xs font-medium text-accent">Dashboard</span>
          <Link href="/upcoming" className="text-xs text-muted hover:text-ink">
            Upcoming
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <MonthSwitcher ym={ym} onShift={(d) => setPicked(shiftYm(ym, d))} />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-pill px-3 py-2 text-xs text-muted ring-1 ring-edge hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="space-y-4">
        <NetWorthHero value={worth} prevValue={data?.prevNetWorth ?? null} />
        <StatTrio earned={earned} spent={spent} kept={kept} />
        <QuotaRings buckets={buckets} selected={selected} onSelect={setSelected} />
        <Flow
          earned={earned}
          buckets={buckets}
          transfers={transfers}
          pots={pots}
          selected={selected}
          onSelect={setSelected}
        />
        <PotCards pots={pots} />
        <UpcomingStrip />
      </div>

      <QuickAdd onAdd={onAdd} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
