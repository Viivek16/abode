"use client";

import { useEffect, useMemo, useState } from "react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import type { NewEntry } from "@/lib/hooks/useDashboard";
import type { BucketKey } from "@/lib/types";

type Kind = "expense" | "income";

export default function QuickAdd({
  onAdd,
}: {
  onAdd: (e: NewEntry) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [kind, setKind] = useState<Kind>("expense");
  const [catIndex, setCatIndex] = useState(0);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  function close() {
    setShown(false);
    setTimeout(() => setOpen(false), 240);
  }

  function reset() {
    setAmount("");
    setNote("");
    setCatIndex(0);
  }

  const amountNum = useMemo(() => parseFloat(amount), [amount]);
  const valid = Number.isFinite(amountNum) && amountNum > 0;

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      if (kind === "expense") {
        const cat = EXPENSE_CATEGORIES[catIndex];
        await onAdd({
          kind: "expense",
          amount: amountNum,
          bucket: cat.bucket as BucketKey,
          category: cat.label,
          note: note.trim() || undefined,
        });
      } else {
        const cat = INCOME_CATEGORIES[catIndex];
        await onAdd({
          kind: "income",
          amount: amountNum,
          source: cat,
          category: cat,
          note: note.trim() || undefined,
        });
      }
      reset();
      close();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Floating honey button */}
      <button
        type="button"
        aria-label="Quick add"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="font-display fixed bottom-6 right-6 z-40 grid size-14 place-items-center rounded-pill bg-accent text-3xl leading-none text-[#14100E] shadow-xl"
      >
        +
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 bg-black/50"
            style={{ opacity: shown ? 1 : 0, transition: "opacity .24s" }}
          />
          {/* sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Quick add"
            className="relative w-full max-w-md rounded-t-card bg-surface p-5 ring-1 ring-edge sm:rounded-card"
            style={{
              transform: shown ? "translateY(0)" : "translateY(100%)",
              transition: "transform .24s cubic-bezier(.22,1,.36,1)",
            }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-pill bg-surface-2 sm:hidden" />

            {/* Expense / Income toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-pill bg-surface-2 p-1">
              {(["expense", "income"] as Kind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setKind(k);
                    setCatIndex(0);
                  }}
                  className={`rounded-pill py-2 text-sm font-medium capitalize transition-colors ${
                    kind === k ? "bg-accent text-[#14100E]" : "text-muted"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Category chips */}
            <p className="eyebrow mt-4 mb-2">
              {kind === "expense" ? "Category" : "Source"}
            </p>
            <div className="flex flex-wrap gap-2">
              {(kind === "expense"
                ? EXPENSE_CATEGORIES.map((c) => c.label)
                : [...INCOME_CATEGORIES]
              ).map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCatIndex(i)}
                  className={`rounded-pill px-3 py-1.5 text-sm ring-1 transition-colors ${
                    catIndex === i
                      ? "bg-surface-2 text-ink ring-accent"
                      : "text-muted ring-edge"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="mt-4 flex items-center gap-2 rounded-button bg-surface-2 px-4">
              <span className="font-display text-xl text-muted">₹</span>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="0"
                className="font-display h-14 w-full bg-transparent text-2xl text-ink outline-none placeholder:text-faint tnum"
              />
            </div>

            {/* Note */}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="mt-3 h-11 w-full rounded-button bg-surface-2 px-4 text-sm text-ink outline-none placeholder:text-faint"
            />

            <button
              type="button"
              onClick={submit}
              disabled={!valid || saving}
              className="font-display mt-4 h-12 w-full rounded-button bg-accent text-base font-semibold text-[#14100E] transition-opacity disabled:opacity-50"
            >
              {saving ? "Adding…" : `Add ${kind}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
