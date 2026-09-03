"use client";

import CountUp from "@/components/ui/CountUp";
import { compact, rupee } from "@/lib/format";
import { useIsOwner } from "@/lib/hooks/useIsOwner";
import type { Pot } from "@/lib/types";
import type { PotInsight } from "@/lib/logic";

const insightValue = (it: PotInsight) =>
  it.currency ? (it.currency.fmt === "rupee" ? rupee(it.currency.n) : compact(it.currency.n)) : it.display;

export default function PotCards({
  pots,
  insights = [],
}: {
  pots: Pot[];
  insights?: PotInsight[];
}) {
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
    <div className="space-y-5">
      {/* Vitals — synthesised figures that aren't shown anywhere above, so this
          section stays informative even before pots are funded. */}
      {insights.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Your money at a glance</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {insights.map((it) => (
              <div key={it.key} className="glass lift p-4">
                <p className="truncate text-[11px] font-medium text-muted">{it.label}</p>
                <p className="font-display mt-1.5 whitespace-nowrap text-[clamp(0.95rem,4.4vw,1.25rem)] font-bold text-ink">
                  {insightValue(it)}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-faint">{it.caption}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="eyebrow mb-3">Pots</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((p) => {
            const color = p.color ?? "var(--muted)";
            return (
              <div key={p.id} className="glass lift relative overflow-hidden p-4">
                <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
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
    </div>
  );
}
