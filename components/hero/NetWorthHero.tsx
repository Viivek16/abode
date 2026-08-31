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
    <section className="ambient glass glass-2 p-7">
      <div className="relative z-10">
        <p className="eyebrow">Liquid net worth</p>
        <CountUp
          value={value}
          format={rupee}
          className="font-display mt-3 block text-[clamp(2.9rem,10vw,3.9rem)] font-semibold leading-[0.95] tracking-tight text-accent"
        />
        <div className="mt-3.5 text-sm">
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
