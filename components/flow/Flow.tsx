"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { rupee } from "@/lib/format";
import type { BucketKey, BucketView, Pot, Transfer } from "@/lib/types";

const MQ = "(prefers-reduced-motion: reduce)";
// Subscribe to the reduced-motion preference without setState-in-effect.
function useMotionOK() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(MQ);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => !window.matchMedia(MQ).matches,
    () => true,
  );
}

// A single proportional bar: a faded "quota" track with a bright "moved into
// pots" fill that grows in (scaleX, so it stays on the GPU) from the left.
function Bar({
  widthPct,
  fillPct,
  color,
  faded,
  ready,
  delay,
  animate,
}: {
  widthPct: number; // bar length as a share of income (0..100)
  fillPct: number; // bright share of THIS bar (0..100)
  color: string;
  faded: string;
  ready: boolean;
  delay: number;
  animate: boolean;
}) {
  return (
    <div
      className="mt-1.5 h-3 overflow-hidden rounded-pill"
      style={{ width: `${Math.max(widthPct, 2.5)}%`, background: faded }}
    >
      <div
        className="h-full origin-left rounded-pill"
        style={{
          width: `${fillPct}%`,
          background: color,
          transform: animate ? `scaleX(${ready ? 1 : 0})` : "none",
          transition: animate
            ? "transform .9s cubic-bezier(.22,1,.36,1)"
            : undefined,
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

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
  const motion = useMotionOK();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Funded pots, in bucket order, for the closing "Pots" strip.
  const potChips = useMemo(() => {
    const order = new Map(buckets.map((b, i) => [b.key, i]));
    const byPot = new Map<string, { amount: number; rank: number }>();
    for (const t of transfers) {
      if (!t.pot_id || Number(t.amount) <= 0) continue;
      const cur = byPot.get(t.pot_id) ?? {
        amount: 0,
        rank: order.get(t.quota_key as BucketKey) ?? 99,
      };
      cur.amount += Number(t.amount);
      byPot.set(t.pot_id, cur);
    }
    const potById = new Map(pots.map((p) => [p.id, p]));
    return [...byPot.entries()]
      .map(([id, v]) => ({
        id,
        amount: v.amount,
        rank: v.rank,
        name: potById.get(id)?.name ?? "Pot",
        color: potById.get(id)?.color ?? "var(--muted)",
      }))
      .sort((a, b) => a.rank - b.rank || b.amount - a.amount);
  }, [transfers, pots, buckets]);

  const barWidth = (v: number) => (earned > 0 ? (v / earned) * 100 : 0);

  return (
    <section className="glass p-6">
      <div className="mb-5">
        <p className="eyebrow">The flow</p>
        <p className="mt-1 text-sm text-muted">Where this month&rsquo;s income goes</p>
      </div>

      {earned <= 0 ? (
        <p className="py-8 text-center text-sm text-faint">
          Add income for this month to see the flow.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Income — the source, full width */}
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-ink">Income</span>
              <span className="tnum text-sm font-semibold text-accent">{rupee(earned)}</span>
            </div>
            <Bar
              widthPct={100}
              fillPct={100}
              color="var(--accent)"
              faded="color-mix(in oklab, var(--accent) 16%, transparent)"
              ready={ready}
              delay={0}
              animate={motion}
            />
          </div>

          {/* Buckets — each bar's length is its share of income; the bright part
              is what has actually been moved into pots. */}
          <div className="space-y-3 border-l border-edge pl-4">
            {buckets.map((b, i) => {
              const dim = selected != null && selected !== b.key;
              const barColor = b.over ? "var(--negative)" : b.color;
              return (
                <button
                  key={b.key}
                  type="button"
                  aria-pressed={selected === b.key}
                  onClick={() => onSelect(selected === b.key ? null : b.key)}
                  className="tap block w-full text-left transition-opacity"
                  style={{ opacity: dim ? 0.35 : 1 }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm text-ink">
                      <span
                        className="inline-block size-2.5 shrink-0 rounded-pill"
                        style={{ background: barColor }}
                      />
                      {b.name}
                      {b.over && (
                        <span className="text-xs font-medium text-negative">over</span>
                      )}
                    </span>
                    <span className="tnum shrink-0 text-[11px] text-muted">
                      {rupee(b.moved)} <span className="text-faint">/ {rupee(b.allocated)}</span>
                    </span>
                  </div>
                  <Bar
                    widthPct={barWidth(b.allocated)}
                    fillPct={Math.round(b.fill * 100)}
                    color={barColor}
                    faded={`color-mix(in oklab, ${b.color} 15%, transparent)`}
                    ready={ready}
                    delay={80 + i * 60}
                    animate={motion}
                  />
                </button>
              );
            })}
          </div>

          {/* Pots — the destinations that actually received money */}
          {potChips.length > 0 && (
            <div className="border-t border-edge pt-4">
              <p className="eyebrow mb-2.5">Pots</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {potChips.map((p) => (
                  <span key={p.id} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-pill"
                      style={{ background: p.color }}
                    />
                    <span className="text-muted">{p.name}</span>
                    <span className="tnum font-medium text-ink">{rupee(p.amount)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
