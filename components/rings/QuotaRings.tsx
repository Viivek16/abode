"use client";

import { useEffect, useState } from "react";
import { compact } from "@/lib/format";
import type { BucketView, BucketKey } from "@/lib/types";

const SIZE = 248;
const C = SIZE / 2;
const RADII = [112, 90, 68, 50]; // outer → inner; inner radius sized to clear the center label
const STROKE = 11;

function Ring({
  radius,
  fill,
  color,
  over,
  dim,
  ready,
}: {
  radius: number;
  fill: number;
  color: string;
  over: boolean;
  dim: boolean;
  ready: boolean;
}) {
  const circ = 2 * Math.PI * radius;
  const shown = ready ? fill : 0;
  const stroke = over ? "var(--negative)" : color;
  return (
    <g transform={`rotate(-90 ${C} ${C})`} opacity={dim ? 0.12 : 1} style={{ transition: "opacity .3s" }}>
      <circle cx={C} cy={C} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={STROKE} />
      <circle
        cx={C}
        cy={C}
        r={radius}
        fill="none"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - shown)}
        style={{ transition: "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1), stroke .3s" }}
      />
    </g>
  );
}

export default function QuotaRings({
  buckets,
  selected,
  onSelect,
  onAllocate,
}: {
  buckets: BucketView[];
  selected: BucketKey | null;
  onSelect: (k: BucketKey | null) => void;
  onAllocate?: () => void;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totalSpent = buckets.reduce((s, b) => s + b.spent, 0);
  const totalAlloc = buckets.reduce((s, b) => s + b.allocated, 0);

  return (
    <section className="glass p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="eyebrow">Quota buckets</p>
        {onAllocate && (
          <button
            type="button"
            onClick={onAllocate}
            className="tap rounded-[8px] px-3 py-1.5 text-xs font-medium text-accent ring-1 ring-accent/30 transition-colors hover:bg-accent/10"
          >
            Allocate →
          </button>
        )}
      </div>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* Rings */}
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
            {buckets.map((b, i) => (
              <Ring
                key={b.key}
                radius={RADII[i]}
                fill={b.fill}
                color={b.color}
                over={b.over}
                dim={selected != null && selected !== b.key}
                ready={ready}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-[92px] flex-col items-center justify-center text-center leading-tight">
            <span className="eyebrow">Spent</span>
            <span className="font-display tnum mt-1 text-lg font-semibold text-ink">
              {compact(totalSpent)}
            </span>
            <span className="tnum mt-0.5 text-[11px] text-muted">
              of {compact(totalAlloc)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <ul className="w-full flex-1 space-y-2.5">
          {buckets.map((b) => {
            const isDim = selected != null && selected !== b.key;
            return (
              <li key={b.key}>
                <button
                  type="button"
                  aria-pressed={selected === b.key}
                  onClick={() => onSelect(selected === b.key ? null : b.key)}
                  className="tap w-full rounded-[10px] p-2 text-left transition-opacity hover:bg-surface-2"
                  style={{ opacity: isDim ? 0.4 : 1 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm text-ink">
                      <span
                        className="inline-block size-2.5 rounded-pill"
                        style={{ background: b.over ? "var(--negative)" : b.color }}
                      />
                      {b.name}
                      {b.over && (
                        <span className="text-xs font-medium text-negative">over</span>
                      )}
                    </span>
                    <span className="tnum text-xs text-muted">
                      {compact(b.spent)} / {compact(b.allocated)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-surface-2">
                    <div
                      className="h-full rounded-pill"
                      style={{
                        width: `${Math.round(b.fill * 100)}%`,
                        background: b.over ? "var(--negative)" : b.color,
                        transition: "width .9s cubic-bezier(.22,1,.36,1)",
                      }}
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
