"use client";

import CountUp from "@/components/ui/CountUp";
import { rupee } from "@/lib/format";

function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone: string;
  hint?: string;
}) {
  return (
    <div className="glass p-4">
      <p className="eyebrow">{label}</p>
      <CountUp
        value={value}
        format={rupee}
        className={`font-display mt-2 block whitespace-nowrap text-[clamp(0.95rem,4.4vw,1.35rem)] font-semibold leading-tight ${tone}`}
      />
      {hint && <p className="mt-1 text-[10px] leading-tight text-faint">{hint}</p>}
    </div>
  );
}

// Four tiles for the selected month. Income = Spent + Balance + Allocated.
export default function StatTrio({
  earned,
  spent,
  balance,
  moved,
}: {
  earned: number;
  spent: number;
  balance: number;
  moved: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Income" value={earned} tone="text-ink" />
      <Stat label="Spent" value={spent} tone="text-negative" />
      <Stat label="Balance" value={balance} tone="text-positive" hint="Income − Spent − Allocated" />
      <Stat label="Allocated" value={moved} tone="text-accent" hint="Moved into pots" />
    </div>
  );
}
