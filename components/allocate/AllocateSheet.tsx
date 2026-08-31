"use client";

import { useEffect, useMemo, useState } from "react";
import { compact, rupee } from "@/lib/format";
import { ymLabel } from "@/lib/logic";
import type { NewTransfer } from "@/lib/hooks/useDashboard";
import type { BucketView, Pot, Transfer } from "@/lib/types";

const digits = (s?: string) => {
  const n = parseInt(s || "", 10);
  return Number.isFinite(n) ? n : 0;
};

export default function AllocateSheet({
  open,
  onClose,
  ym,
  buckets,
  pots,
  transfers,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  ym: string;
  buckets: BucketView[];
  pots: Pot[];
  transfers: Transfer[];
  onSave: (t: NewTransfer[]) => Promise<void>;
}) {
  const [shown, setShown] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Pots grouped under their quota (bank + unassigned excluded).
  const byQuota = useMemo(() => {
    const m = new Map<string, Pot[]>();
    for (const p of pots) {
      if (p.is_bank || !p.bucket_key) continue;
      const a = m.get(p.bucket_key) ?? [];
      a.push(p);
      m.set(p.bucket_key, a);
    }
    return m;
  }, [pots]);

  // Already transferred this month, per pot.
  const existing = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of transfers)
      if (t.pot_id) m.set(t.pot_id, (m.get(t.pot_id) ?? 0) + Number(t.amount));
    return m;
  }, [transfers]);

  const total = Object.values(amounts).reduce((s, v) => s + digits(v), 0);

  function close() {
    setShown(false);
    setTimeout(onClose, 400);
  }

  async function save() {
    const list: NewTransfer[] = [];
    for (const p of pots) {
      const a = digits(amounts[p.id]);
      if (a > 0 && p.bucket_key) list.push({ pot_id: p.id, quota_key: p.bucket_key, amount: a });
    }
    if (!list.length || saving) return;
    setSaving(true);
    try {
      await onSave(list);
      setAmounts({});
      close();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const rows = buckets.filter((b) => byQuota.get(b.key)?.length);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        style={{ opacity: shown ? 1 : 0, transition: "opacity .4s var(--ease-drawer)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Allocate quotas into pots"
        className="glass glass-2 relative flex max-h-[85vh] w-full max-w-md flex-col rounded-t-card p-6 pb-7 sm:rounded-card"
        style={{
          transform: shown ? "translateY(0)" : "translateY(100%)",
          transition: "transform .4s var(--ease-drawer)",
        }}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-pill bg-surface-2 sm:hidden" />

        <div className="mb-4 flex items-baseline justify-between">
          <p className="font-display text-lg font-semibold text-ink">Allocate</p>
          <span className="text-xs text-muted">{ymLabel(ym)}</span>
        </div>

        <div className="-mx-1 flex-1 space-y-5 overflow-y-auto px-1">
          {rows.length === 0 && (
            <p className="py-8 text-center text-sm text-faint">
              Add income first to see quotas to allocate.
            </p>
          )}
          {rows.map((b) => {
            const potList = byQuota.get(b.key)!;
            const used =
              potList.reduce((s, p) => s + (existing.get(p.id) ?? 0), 0) +
              potList.reduce((s, p) => s + digits(amounts[p.id]), 0);
            const remaining = b.allocated - used;
            return (
              <div key={b.key}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    <span
                      className="inline-block size-2.5 rounded-pill"
                      style={{ background: b.color }}
                    />
                    {b.name}
                  </span>
                  <span
                    className={`tnum text-xs ${remaining < 0 ? "text-negative" : "text-muted"}`}
                  >
                    {compact(remaining)} left of {compact(b.allocated)}
                  </span>
                </div>
                <div className="space-y-2">
                  {potList.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 rounded-[10px] bg-surface-2 px-4 py-2.5"
                    >
                      <span className="flex-1 truncate text-sm text-muted">{p.name}</span>
                      <span className="text-sm text-faint">₹</span>
                      <input
                        inputMode="numeric"
                        value={amounts[p.id] ? Number(amounts[p.id]).toLocaleString("en-IN") : ""}
                        onChange={(e) =>
                          setAmounts((a) => ({ ...a, [p.id]: e.target.value.replace(/\D/g, "") }))
                        }
                        placeholder="0"
                        className="tnum w-24 bg-transparent text-right text-sm text-ink outline-none placeholder:text-faint"
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={total <= 0 || saving}
          className="mt-5 h-12 w-full rounded-[10px] bg-accent text-base font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(205,163,73,0.7)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
        >
          {saving ? "Allocating…" : total > 0 ? `Allocate ${rupee(total)}` : "Allocate"}
        </button>
      </div>
    </div>
  );
}
