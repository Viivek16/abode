"use client";

import { useMemo, useRef, useState } from "react";
import { compact } from "@/lib/format";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Honey ramp, 0 (empty) -> 4 (peak).
const STEP_BG = [
  "var(--surface-2)",
  "rgba(216,172,85,0.24)",
  "rgba(216,172,85,0.44)",
  "rgba(216,172,85,0.7)",
  "var(--accent)",
];

export type HeatCell = { ym: string; income: number; spent: number };

type Hover = {
  label: string;
  income: number;
  spent: number;
  left: number;
  top: number;
};

export default function IncomeHeatmap({
  data,
  selectedYm,
  onSelect,
}: {
  data: HeatCell[];
  selectedYm?: string | null;
  onSelect?: (ym: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const { years, byKey, max } = useMemo(() => {
    const byKey = new Map<string, HeatCell>();
    let max = 0;
    const yearsSet = new Set<number>();
    for (const d of data) {
      const [y] = d.ym.split("-").map(Number);
      yearsSet.add(y);
      byKey.set(d.ym, d);
      if (d.income > max) max = d.income;
    }
    return { years: [...yearsSet].sort((a, b) => a - b), byKey, max };
  }, [data]);

  const step = (v: number) => (v <= 0 || max <= 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)));

  function enter(e: React.MouseEvent, label: string, income: number, spent: number) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const r = e.currentTarget.getBoundingClientRect();
    const cx = r.left - box.left + r.width / 2;
    setHover({
      label,
      income,
      spent,
      left: Math.min(Math.max(cx, 92), box.width - 92), // keep the 176px card on-screen
      top: r.top - box.top,
    });
  }

  return (
    <section ref={ref} className="glass relative p-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow">Income map</p>
          <p className="mt-1 text-sm text-muted">Every month you&rsquo;ve tracked</p>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
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
        <div className="min-w-[264px]">
          <div className="mb-2 grid grid-cols-[1.75rem_repeat(12,1fr)] gap-1.5">
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
              className="mb-1.5 grid grid-cols-[1.75rem_repeat(12,1fr)] items-center gap-1.5"
            >
              <span className="tnum text-[11px] font-medium text-muted">{year}</span>
              {Array.from({ length: 12 }, (_, m) => {
                const ym = `${year}-${String(m + 1).padStart(2, "0")}`;
                const cell = byKey.get(ym);
                const income = cell?.income ?? 0;
                const spent = cell?.spent ?? 0;
                const s = step(income);
                const active = selectedYm === ym;
                const label = `${FULL[m]} ${year}`;
                const inner = (
                  <span
                    className="block aspect-square w-full rounded-[5px]"
                    style={{
                      background: STEP_BG[s],
                      border: active ? "1px solid var(--accent-soft)" : "1px solid var(--edge)",
                      boxShadow: active ? "0 0 0 2px rgba(216,172,85,0.4)" : undefined,
                    }}
                  />
                );
                return onSelect ? (
                  <button
                    key={m}
                    type="button"
                    aria-label={`${label}, ${income > 0 ? compact(income) : "no income"}`}
                    onMouseEnter={(e) => enter(e, label, income, spent)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onSelect(ym)}
                    className="block transition-transform hover:-translate-y-px focus-visible:-translate-y-px"
                  >
                    {inner}
                  </button>
                ) : (
                  <span
                    key={m}
                    onMouseEnter={(e) => enter(e, label, income, spent)}
                    onMouseLeave={() => setHover(null)}
                  >
                    {inner}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* big hover card: income / spent / kept */}
      {hover && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ left: hover.left, top: hover.top - 10 }}
        >
          <div className="pop-in glass glass-2 w-44 rounded-[12px] p-3.5">
            <p className="text-xs font-semibold text-ink">{hover.label}</p>
            <div className="mt-2.5 space-y-1.5">
              {(
                [
                  ["Income", hover.income, "text-ink"],
                  ["Spent", hover.spent, "text-negative"],
                  ["Kept", hover.income - hover.spent, "text-positive"],
                ] as const
              ).map(([k, v, tone]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted">{k}</span>
                  <span className={`font-display tnum text-sm font-semibold ${tone}`}>
                    {compact(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
