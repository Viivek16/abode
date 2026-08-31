"use client";

import { useMemo } from "react";
import { compact } from "@/lib/format";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Honey ramp, 0 (empty) -> 4 (peak).
const STEP_BG = [
  "var(--surface-2)",
  "rgba(205,163,73,0.22)",
  "rgba(205,163,73,0.42)",
  "rgba(205,163,73,0.68)",
  "var(--accent)",
];

export type HeatCell = { ym: string; value: number };

export default function IncomeHeatmap({
  data,
  metricLabel = "income",
  selectedYm,
  onSelect,
}: {
  data: HeatCell[];
  metricLabel?: string;
  selectedYm?: string | null;
  onSelect?: (ym: string) => void;
}) {
  const { years, byKey, max } = useMemo(() => {
    const byKey = new Map<string, number>();
    let max = 0;
    const yearsSet = new Set<number>();
    for (const d of data) {
      const [y] = d.ym.split("-").map(Number);
      yearsSet.add(y);
      byKey.set(d.ym, d.value);
      if (d.value > max) max = d.value;
    }
    return { years: [...yearsSet].sort((a, b) => a - b), byKey, max };
  }, [data]);

  const step = (v: number) => (v <= 0 || max <= 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)));

  return (
    <section className="glass p-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow">Income map</p>
          <p className="mt-1 text-sm text-muted">
            Every month, by {metricLabel} received
          </p>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <span className="text-[11px] text-faint">Less</span>
          {STEP_BG.map((bg, i) => (
            <span
              key={i}
              className="size-3 rounded-[4px]"
              style={{ background: bg, border: "1px solid var(--edge)" }}
            />
          ))}
          <span className="text-[11px] text-faint">More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          {/* month header */}
          <div className="mb-1.5 grid grid-cols-[1.75rem_repeat(12,1fr)] gap-1">
            <span />
            {MONTHS.map((m, i) => (
              <span key={i} className="text-center text-[10px] font-medium text-faint">
                {m}
              </span>
            ))}
          </div>

          {years.map((year) => (
            <div
              key={year}
              className="mb-1.5 grid grid-cols-[1.75rem_repeat(12,1fr)] items-center gap-1"
            >
              <span className="tnum text-[11px] font-medium text-muted">{year}</span>
              {Array.from({ length: 12 }, (_, m) => {
                const ym = `${year}-${String(m + 1).padStart(2, "0")}`;
                const value = byKey.get(ym) ?? 0;
                const s = step(value);
                const active = selectedYm === ym;
                const cell = (
                  <span
                    className="block aspect-square w-full rounded-[5px] transition-transform duration-150"
                    style={{
                      background: STEP_BG[s],
                      border: active
                        ? "1px solid var(--accent-soft)"
                        : "1px solid var(--edge)",
                      boxShadow: active ? "0 0 0 2px rgba(205,163,73,0.35)" : undefined,
                    }}
                  />
                );
                const title = `${FULL[m]} ${year} · ${value > 0 ? compact(value) : "—"}`;
                return onSelect ? (
                  <button
                    key={m}
                    type="button"
                    title={title}
                    aria-label={title}
                    onClick={() => onSelect(ym)}
                    className="group/cell block hover:-translate-y-px focus-visible:-translate-y-px"
                  >
                    {cell}
                  </button>
                ) : (
                  <span key={m} title={title}>
                    {cell}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
