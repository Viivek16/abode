"use client";

// DEV-ONLY visual harness for the redesign. Renders every dashboard surface with
// mock data so the UI can be reviewed without auth/Supabase. Not shipped in prod.
import { useState, type CSSProperties, type ReactNode } from "react";
import NetWorthHero from "@/components/hero/NetWorthHero";
import StatTrio from "@/components/stats/StatTrio";
import QuotaRings from "@/components/rings/QuotaRings";
import Flow from "@/components/flow/Flow";
import IncomeHeatmap from "@/components/heatmap/IncomeHeatmap";
import PotCards from "@/components/pots/PotCards";
import MonthSwitcher from "@/components/month-switcher/MonthSwitcher";
import UpcomingStrip from "@/components/upcoming/UpcomingStrip";
import QuickAdd from "@/components/quick-add/QuickAdd";
import type { BucketKey, BucketView, Pot, Transfer } from "@/lib/types";

const buckets: BucketView[] = [
  { key: "bills", name: "Bills + Savings", color: "#7FA893", allocated: 200000, spent: 15500, fill: 0.0775, over: false },
  { key: "invest", name: "Investments", color: "#8C93C7", allocated: 150000, spent: 15500, fill: 0.103, over: false },
  { key: "emergency", name: "Emergency", color: "#CBA35C", allocated: 75000, spent: 0, fill: 0, over: false },
  { key: "personal", name: "Personal", color: "#B487AE", allocated: 75000, spent: 15000, fill: 0.2, over: false },
];

const pots: Pot[] = [
  { id: "p1", key: "savings", name: "Savings", bucket_key: "bills", color: "#7FA893", icon: null, is_bank: false, current_balance: 176400, created_at: "" },
  { id: "p2", key: "vacation", name: "Vacation", bucket_key: "emergency", color: "#CBA35C", icon: null, is_bank: false, current_balance: 200000, created_at: "" },
  { id: "p3", key: "stocks", name: "Stocks", bucket_key: "invest", color: "#8C93C7", icon: null, is_bank: false, current_balance: 60270, created_at: "" },
  { id: "p4", key: "crypto", name: "Crypto", bucket_key: "invest", color: "#8C93C7", icon: null, is_bank: false, current_balance: 292680, created_at: "" },
  { id: "p5", key: "mf", name: "Mutual Funds", bucket_key: "invest", color: "#8C93C7", icon: null, is_bank: false, current_balance: 1228846, created_at: "" },
  { id: "p6", key: "bank", name: "Bank", bucket_key: null, color: "#CDA349", icon: null, is_bank: true, current_balance: 1179218, created_at: "" },
];

const transfers: Transfer[] = [
  { id: "t1", entry_date: "", ym: "2026-06", pot_id: "p1", quota_key: "bills", amount: 99500, created_at: "" },
  { id: "t2", entry_date: "", ym: "2026-06", pot_id: "p2", quota_key: "emergency", amount: 20000, created_at: "" },
  { id: "t3", entry_date: "", ym: "2026-06", pot_id: "p4", quota_key: "invest", amount: 10000, created_at: "" },
  { id: "t4", entry_date: "", ym: "2026-06", pot_id: "p5", quota_key: "invest", amount: 45000, created_at: "" },
];

const monthly = [
  { ym: "2024-07", value: 288332 }, { ym: "2024-09", value: 210000 },
  { ym: "2024-11", value: 320000 }, { ym: "2024-12", value: 150000 },
  { ym: "2025-01", value: 260000 }, { ym: "2025-03", value: 410000 },
  { ym: "2025-05", value: 190000 }, { ym: "2025-07", value: 300000 },
  { ym: "2025-09", value: 355000 }, { ym: "2025-11", value: 275000 },
  { ym: "2026-01", value: 240000 }, { ym: "2026-03", value: 500000 },
  { ym: "2026-05", value: 330000 }, { ym: "2026-06", value: 159814 },
];

export default function PreviewInner() {
  const [selected, setSelected] = useState<BucketKey | null>(null);

  const sections: ReactNode[] = [
    <NetWorthHero key="hero" value={3331014} prevValue={3100000} />,
    <StatTrio key="stats" earned={159814} spent={46000} kept={113814} />,
    <QuotaRings key="rings" buckets={buckets} selected={selected} onSelect={setSelected} />,
    <Flow key="flow" earned={159814} buckets={buckets} transfers={transfers} pots={pots} selected={selected} onSelect={setSelected} />,
    <IncomeHeatmap key="heat" data={monthly} selectedYm="2026-06" onSelect={() => {}} />,
    <PotCards key="pots" pots={pots} />,
    <UpcomingStrip key="upcoming" />,
  ];

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-4">
          <p className="font-display text-xl font-semibold tracking-tight text-ink">Abode</p>
          <span className="rounded-pill bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">Dashboard</span>
          <span className="text-xs text-muted">Upcoming</span>
        </div>
        <MonthSwitcher ym="2026-06" onShift={() => {}} />
      </header>

      <div className="space-y-5">
        {sections.map((node, i) => (
          <div key={i} className="reveal" style={{ "--i": i } as CSSProperties}>
            {node}
          </div>
        ))}
      </div>

      <QuickAdd onAdd={async () => {}} />
    </main>
  );
}
