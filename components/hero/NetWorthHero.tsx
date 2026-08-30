"use client";

import CountUp from "@/components/ui/CountUp";
import { rupee, signedPct } from "@/lib/format";
import { deltaPct } from "@/lib/logic";

export default function NetWorthHero({
  value,
  prevValue,
}: {
  value: number;
  prevValue: number | null;
}) {
  const delta = prevValue != null ? deltaPct(value, prevValue) : null;
  const up = (delta ?? 0) >= 0;

  return (
    <section className="ambient rounded-card bg-surface p-6 ring-1 ring-edge">
      <div className="relative z-10">
        <p className="eyebrow">Liquid net worth</p>
        <CountUp
          value={value}
          format={rupee}
          className="font-display mt-2 block text-[clamp(2.75rem,9vw,3.25rem)] font-extrabold leading-none text-accent"
        />
        <div className="mt-3 text-sm">
          {delta != null ? (
            <span className={up ? "text-positive" : "text-negative"}>
              {signedPct(delta)}{" "}
              <span className="text-muted">vs last month</span>
            </span>
          ) : (
            <span className="text-faint">No prior month to compare yet</span>
          )}
        </div>
      </div>
    </section>
  );
}
