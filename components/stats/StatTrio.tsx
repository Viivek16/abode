"use client";

import CountUp from "@/components/ui/CountUp";
import { compact } from "@/lib/format";

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
    <div className="glass p-4">
      <p className="eyebrow">{label}</p>
      <CountUp
        value={value}
        format={compact}
        className={`font-display mt-2 block whitespace-nowrap text-xl font-semibold ${tone}`}
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
