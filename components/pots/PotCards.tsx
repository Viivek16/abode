"use client";

import CountUp from "@/components/ui/CountUp";
import { rupee } from "@/lib/format";
import { useIsOwner } from "@/lib/hooks/useIsOwner";
import type { Pot } from "@/lib/types";

export default function PotCards({ pots }: { pots: Pot[] }) {
  const { data: isOwner } = useIsOwner();

  // The owner's pots mirror a Google Sheet, so every one is shown as-is.
  // For everyone else, pots *emerge from allocation*: a tile appears only once a
  // pot has actually received money. The liquid bank always shows — it holds
  // whatever income has not been allocated yet.
  const visible = isOwner
    ? pots
    : pots.filter((p) => p.is_bank || Number(p.current_balance) > 0);
  const funded = visible.some((p) => !p.is_bank);

  return (
    <section>
      <p className="eyebrow mb-3">Pots</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visible.map((p) => {
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
      {!isOwner && !funded && (
        <p className="mt-3 text-xs text-faint">
          Allocate your income to form pots — each destination becomes a tile here.
        </p>
      )}
    </section>
  );
}
