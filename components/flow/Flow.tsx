"use client";

import { useMemo, type CSSProperties } from "react";
import { rupee } from "@/lib/format";
import type { BucketKey, BucketView, Pot, Transfer } from "@/lib/types";

type PotSlice = { name: string; color: string; amount: number };

// A partition / icicle view of the month: income (left) splits into quota
// buckets (middle, height ∝ allocated), and each bucket splits again into the
// pots it funded plus whatever is still unallocated (right). Pure-DOM flex so
// it stays crisp and never overflows on a phone.
export default function Flow({
  earned,
  buckets,
  transfers,
  pots,
  selected,
  onSelect,
}: {
  earned: number;
  buckets: BucketView[];
  transfers: Transfer[];
  pots: Pot[];
  selected: BucketKey | null;
  onSelect: (k: BucketKey | null) => void;
}) {
  const potsByBucket = useMemo(() => {
    const meta = new Map(pots.map((p) => [p.id, p]));
    const agg = new Map<string, { amount: number; bucket: string; potId: string }>();
    for (const t of transfers) {
      if (!t.pot_id || Number(t.amount) <= 0) continue;
      const cur = agg.get(t.pot_id) ?? { amount: 0, bucket: t.quota_key as string, potId: t.pot_id };
      cur.amount += Number(t.amount);
      agg.set(t.pot_id, cur);
    }
    const byBucket = new Map<string, PotSlice[]>();
    for (const v of agg.values()) {
      const arr = byBucket.get(v.bucket) ?? [];
      arr.push({
        name: meta.get(v.potId)?.name ?? "Pot",
        color: meta.get(v.potId)?.color ?? "var(--muted)",
        amount: v.amount,
      });
      byBucket.set(v.bucket, arr);
    }
    for (const arr of byBucket.values()) arr.sort((a, b) => b.amount - a.amount);
    return byBucket;
  }, [transfers, pots]);

  // Label visibility from each block's share of income, so tiny slivers stay
  // clean (colour only) instead of clipping text.
  const frac = (v: number) => (earned > 0 ? v / earned : 0);
  const showName = (v: number) => frac(v) >= 0.05;
  const showAmt = (v: number) => frac(v) >= 0.1;
  const grow = { transition: "flex-grow .7s cubic-bezier(.22,1,.36,1)" } as const;

  return (
    <section className="glass p-6">
      <div className="mb-4">
        <p className="eyebrow">The flow</p>
        <p className="mt-1 text-sm text-muted">Income splits into buckets, then into pots</p>
      </div>

      {earned <= 0 ? (
        <p className="py-8 text-center text-sm text-faint">
          Add income for this month to see the flow.
        </p>
      ) : (
        <>
          <div className="mb-2 flex gap-2">
            <span className="w-[52px] shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-faint sm:w-16">
              Income
            </span>
            <span className="flex-[1.05] text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
              Buckets
            </span>
            <span className="flex-[1.35] text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
              Pots · unallocated
            </span>
          </div>

          <div className="flex h-[300px] gap-2">
            {/* Income — the source */}
            <div className="flex w-[52px] shrink-0 items-center justify-center rounded-[10px] bg-accent sm:w-16">
              <span className="font-display rotate-180 whitespace-nowrap text-[13px] font-semibold text-[#14100E] [writing-mode:vertical-rl]">
                {rupee(earned)}
              </span>
            </div>

            {/* Buckets — height ∝ allocated */}
            <div className="flex flex-[1.05] flex-col gap-1.5">
              {buckets.map((b) => {
                const dim = selected != null && selected !== b.key;
                return (
                  <button
                    key={b.key}
                    type="button"
                    aria-pressed={selected === b.key}
                    title={`${b.name} · ${rupee(b.allocated)}`}
                    onClick={() => onSelect(selected === b.key ? null : b.key)}
                    className="tap flex min-h-0 basis-0 flex-col justify-center overflow-hidden rounded-[9px] px-2.5 text-left transition-opacity"
                    style={{ flexGrow: b.allocated, background: b.color, opacity: dim ? 0.4 : 1, ...grow } as CSSProperties}
                  >
                    {showName(b.allocated) && (
                      <span className="truncate text-[12px] font-semibold leading-tight text-[#14100E]">
                        {b.name}
                      </span>
                    )}
                    {showAmt(b.allocated) && (
                      <span className="tnum truncate text-[10.5px] leading-tight text-[#14100E]/75">
                        {rupee(b.allocated)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pots + unallocated — each bucket zone splits again */}
            <div className="flex flex-[1.35] flex-col gap-1.5">
              {buckets.map((b) => {
                const slices = potsByBucket.get(b.key) ?? [];
                const rem = Math.max(b.allocated - b.moved, 0);
                const dim = selected != null && selected !== b.key;
                return (
                  <div
                    key={b.key}
                    className="flex min-h-0 basis-0 flex-col gap-px overflow-hidden rounded-[9px] transition-opacity"
                    style={{ flexGrow: b.allocated, opacity: dim ? 0.4 : 1, ...grow } as CSSProperties}
                  >
                    {slices.map((p, i) => (
                      <div
                        key={i}
                        title={`${p.name} · ${rupee(p.amount)}`}
                        className="flex min-h-0 basis-0 items-center overflow-hidden px-2.5"
                        style={{ flexGrow: p.amount, background: p.color, ...grow } as CSSProperties}
                      >
                        {showName(p.amount) && (
                          <span className="truncate text-[11px] font-medium leading-none text-[#14100E]">
                            {p.name}
                            {showAmt(p.amount) && (
                              <span className="tnum font-normal text-[#14100E]/70"> · {rupee(p.amount)}</span>
                            )}
                          </span>
                        )}
                      </div>
                    ))}
                    {rem > 0 && (
                      // The remainder always carries its amount — it's the whole
                      // point of the column, so it's never hidden behind a size gate.
                      <div
                        title={`Unallocated · ${rupee(rem)}`}
                        className="flex min-h-0 basis-0 items-center overflow-hidden px-2.5"
                        style={{ flexGrow: rem, background: `color-mix(in oklab, ${b.color} 18%, transparent)`, ...grow } as CSSProperties}
                      >
                        <span className="truncate text-[10px] leading-none text-muted">
                          Unallocated<span className="tnum"> · {rupee(rem)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
