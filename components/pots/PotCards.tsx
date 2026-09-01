"use client";

import CountUp from "@/components/ui/CountUp";
import { rupee } from "@/lib/format";
import type { Pot } from "@/lib/types";

export default function PotCards({ pots }: { pots: Pot[] }) {
  return (
    <section>
      <p className="eyebrow mb-3">Pots</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pots.map((p) => {
          const color = p.color ?? "var(--muted)";
          return (
            <div
              key={p.id}
              className="glass lift relative overflow-hidden p-4"
            >
              <span
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: color }}
              />
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-pill"
                  style={{ background: color }}
                />
                <p className="truncate text-sm text-muted">{p.name}</p>
                {p.is_bank && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-faint">
                    bank
                  </span>
                )}
              </div>
              <CountUp
                value={Number(p.current_balance)}
                format={rupee}
                className="font-display mt-2 block whitespace-nowrap text-[clamp(0.9rem,4vw,1.125rem)] font-bold text-ink"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
