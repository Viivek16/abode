"use client";

import CountUp from "@/components/ui/CountUp";
import { rupee } from "@/lib/format";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-card bg-surface p-4 ring-1 ring-edge">
      <p className="eyebrow">{label}</p>
      <CountUp
        value={value}
        format={rupee}
        className={`font-display mt-1.5 block text-xl font-bold ${tone}`}
      />
    </div>
  );
}

export default function StatTrio({
  earned,
  spent,
  kept,
}: {
  earned: number;
  spent: number;
  kept: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Earned" value={earned} tone="text-ink" />
      <Stat label="Spent" value={spent} tone="text-negative" />
      <Stat label="Kept" value={kept} tone="text-positive" />
    </div>
  );
}
