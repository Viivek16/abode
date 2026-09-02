"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import NetWorthHero from "@/components/hero/NetWorthHero";
import StatTrio from "@/components/stats/StatTrio";
import QuotaRings from "@/components/rings/QuotaRings";
import Flow from "@/components/flow/Flow";
import EntriesList from "@/components/entries/EntriesList";
import IncomeHeatmap from "@/components/heatmap/IncomeHeatmap";
import PotCards from "@/components/pots/PotCards";
import MonthSwitcher from "@/components/month-switcher/MonthSwitcher";
import NotepadStrip from "@/components/notepad/NotepadStrip";
import TopNav from "@/components/nav/TopNav";
import QuickAdd from "@/components/quick-add/QuickAdd";
import AllocateSheet from "@/components/allocate/AllocateSheet";
import Toast from "@/components/ui/Toast";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import {
  useAddEntry,
  useAddTransfers,
  useDashboardData,
  useIncomeMonths,
  useMonthlyTotals,
  useRealtime,
  type NewEntry,
  type NewTransfer,
} from "@/lib/hooks/useDashboard";
import { useNeedsOnboarding } from "@/lib/hooks/useOnboarding";
import { currentYm, deriveMonth, netWorth, shiftYm, sumAmount } from "@/lib/logic";
import type { BucketKey } from "@/lib/types";

export default function Dashboard() {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);
  const [selected, setSelected] = useState<BucketKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [allocateOpen, setAllocateOpen] = useState(false);

  // Brand-new friends are sent to onboarding before they see an empty dashboard.
  const { data: needsOnboarding } = useNeedsOnboarding();
  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  const { data: incomeMonths } = useIncomeMonths();
  const { data: monthly } = useMonthlyTotals();
  // Default to the latest month that has income; an explicit pick takes over once made.
  const ym = picked ?? incomeMonths?.[incomeMonths.length - 1] ?? currentYm();

  const { data, isLoading } = useDashboardData(ym);
  useRealtime(ym);
  const addEntry = useAddEntry(ym);
  const addTransfers = useAddTransfers(ym);

  const quota = data?.quota ?? [];
  const income = data?.income ?? [];
  const expenses = data?.expenses ?? [];
  const pots = data?.pots ?? [];
  const transfers = data?.transfers ?? [];

  const { earned, spent, buckets } = deriveMonth(quota, income, expenses, transfers);
  const moved = sumAmount(transfers);
  const balance = earned - spent - moved;
  const worth = netWorth(pots);

  async function onAdd(e: NewEntry) {
    await addEntry.mutateAsync(e);
    setToast(e.kind === "expense" ? "Expense added" : "Income added");
  }

  async function onAllocate(list: NewTransfer[]) {
    await addTransfers.mutateAsync(list);
    setToast("Allocated");
  }

  const sections: ReactNode[] = [
    <NetWorthHero key="hero" value={worth} prevValue={data?.prevNetWorth ?? null} />,
    <StatTrio key="stats" earned={earned} spent={spent} balance={balance} moved={moved} />,
    <EntriesList key="entries" income={income} expenses={expenses} transfers={transfers} pots={pots} ym={ym} />,
    <QuotaRings
      key="rings"
      buckets={buckets}
      moved={moved}
      earned={earned}
      selected={selected}
      onSelect={setSelected}
      onAllocate={() => setAllocateOpen(true)}
    />,
    <Flow
      key="flow"
      earned={earned}
      buckets={buckets}
      transfers={transfers}
      pots={pots}
      selected={selected}
      onSelect={setSelected}
    />,
    <IncomeHeatmap
      key="heat"
      data={monthly ?? []}
      selectedYm={ym}
      onSelect={(m) => setPicked(m)}
    />,
    <PotCards key="pots" pots={pots} />,
    <NotepadStrip key="notepad" />,
  ];

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
      <TopNav />

      {/* Month scroller — its own centred row so the top bar stays minimal */}
      <div className="mb-5 flex justify-center">
        <MonthSwitcher ym={ym} onShift={(d) => setPicked(shiftYm(ym, d))} />
      </div>

      {isLoading && !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-5">
          {sections.map((node, i) => (
            <div
              key={i}
              className="reveal"
              style={{ "--i": i } as CSSProperties}
            >
              {node}
            </div>
          ))}
        </div>
      )}

      <QuickAdd onAdd={onAdd} />
      <AllocateSheet
        open={allocateOpen}
        onClose={() => setAllocateOpen(false)}
        ym={ym}
        buckets={buckets}
        pots={pots}
        transfers={transfers}
        onSave={onAllocate}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
