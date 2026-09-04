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
import QuickAdd from "@/components/quick-add/QuickAdd";
import AllocateSheet from "@/components/allocate/AllocateSheet";
import Toast from "@/components/ui/Toast";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import {
  useAddEntry,
  useAddTransfers,
  useDashboardData,
  useMonthlyTotals,
  useRealtime,
  type NewEntry,
  type NewTransfer,
} from "@/lib/hooks/useDashboard";
import { useNeedsOnboarding } from "@/lib/hooks/useOnboarding";
import { useIsOwner } from "@/lib/hooks/useIsOwner";
import { cumulativeSavings, deriveMonth, netWorth, potInsights, shiftYm, sumAmount } from "@/lib/logic";
import type { BucketKey } from "@/lib/types";

export default function Dashboard({
  active = true,
  ym,
  onPickMonth,
}: {
  active?: boolean;
  ym: string;
  onPickMonth: (ym: string) => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<BucketKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [allocateOpen, setAllocateOpen] = useState(false);

  // Brand-new friends are sent to onboarding before they see an empty dashboard.
  const { data: needsOnboarding } = useNeedsOnboarding();
  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  const { data: isOwner } = useIsOwner();
  const { data: monthly } = useMonthlyTotals();

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
  // The owner's net worth mirrors their sheet (real pot balances). Everyone else
  // has no balances logged, so we accumulate their monthly savings up to the
  // displayed month — first month = that month's savings, then it compounds.
  const worth = isOwner ? netWorth(pots) : cumulativeSavings(monthly ?? [], ym);
  const prevWorth = isOwner
    ? data?.prevNetWorth ?? null
    : cumulativeSavings(monthly ?? [], shiftYm(ym, -1));
  const insights = potInsights({ earned, spent, moved, pots, monthly: monthly ?? [], expenses, buckets });

  async function onAdd(e: NewEntry) {
    await addEntry.mutateAsync(e);
    setToast(e.kind === "expense" ? "Expense added" : "Income added");
  }

  async function onAllocate(list: NewTransfer[]) {
    await addTransfers.mutateAsync(list);
    setToast("Allocated");
  }

  const sections: ReactNode[] = [
    <NetWorthHero key="hero" value={worth} prevValue={prevWorth} />,
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
      onSelect={onPickMonth}
    />,
    <PotCards key="pots" pots={pots} insights={insights} />,
  ];

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-28 pt-0">
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

      {/* Viewport-fixed controls belong only to the visible pane. */}
      {active && (
        <>
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
        </>
      )}
    </main>
  );
}
