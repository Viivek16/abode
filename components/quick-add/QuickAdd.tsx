"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EXPENSE_CATEGORIES,
  GENERIC_INCOME_SOURCES,
  INCOME_SOURCES,
} from "@/lib/constants";
import { currentYm, shiftYm, ymLabel } from "@/lib/logic";
import { ymToTabTitle } from "@/lib/sheets/months";
import { useIsOwner } from "@/lib/hooks/useIsOwner";
import type { NewEntry } from "@/lib/hooks/useDashboard";
import type { BucketKey } from "@/lib/types";

type Kind = "income" | "expense";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function QuickAdd({
  onAdd,
}: {
  onAdd: (e: NewEntry) => Promise<void>;
}) {
  const { data: isOwner } = useIsOwner();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [kind, setKind] = useState<Kind>("income");
  const [catIndex, setCatIndex] = useState(0); // expense category
  const [srcIndex, setSrcIndex] = useState(0); // income source
  const [customSource, setCustomSource] = useState("");
  const [amount, setAmount] = useState(""); // digits only
  const [note, setNote] = useState("");
  const [month, setMonth] = useState(currentYm());
  const [tabTitle, setTabTitle] = useState(""); // owner's typed override
  const [tabEdited, setTabEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  const incomeSources = isOwner ? INCOME_SOURCES : GENERIC_INCOME_SOURCES;
  // Suggested tab name tracks the chosen month until the owner types their own.
  const effectiveTab = tabEdited ? tabTitle : ymToTabTitle(month);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  function close() {
    setShown(false);
    setTimeout(() => setOpen(false), 400);
  }

  function reset() {
    setAmount("");
    setNote("");
    setCatIndex(0);
    setSrcIndex(0);
    setCustomSource("");
    setMonth(currentYm());
    setTabTitle("");
    setTabEdited(false);
  }

  const amountNum = useMemo(() => (amount ? parseInt(amount, 10) : NaN), [amount]);
  const isOther = kind === "income" && srcIndex === incomeSources.length - 1;
  // A tag is mandatory on income: "Other" must be named before saving.
  const tagOk = kind === "expense" || !isOther || customSource.trim().length > 0;
  const valid = Number.isFinite(amountNum) && amountNum > 0 && tagOk;
  const grouped = amount ? Number(amount).toLocaleString("en-IN") : "";
  const atCurrentMonth = month === currentYm();

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
          ym: month,
        });
      } else {
        const source = isOther
          ? customSource.trim() || "Other"
          : incomeSources[srcIndex];
        await onAdd({
          kind: "income",
          amount: amountNum,
          source,
          category: source,
          note: note.trim() || undefined,
          ym: month,
          tabTitle: isOwner ? effectiveTab.trim() || undefined : undefined,
        });
      }
      reset();
      close();
    } finally {
      setSaving(false);
    }
  }

  const chips =
    kind === "expense"
      ? EXPENSE_CATEGORIES.map((c) => c.label)
      : [...incomeSources];
  const activeChip = kind === "expense" ? catIndex : srcIndex;
  const setChip = kind === "expense" ? setCatIndex : setSrcIndex;

  return (
    <>
      {/* Floating honey button */}
      <button
        type="button"
        aria-label="Add income"
        onClick={() => {
          reset();
          setKind("income");
          setOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 grid size-14 place-items-center rounded-pill bg-accent text-3xl font-light leading-none text-[#14100E] shadow-[0_10px_30px_-8px_rgba(205,163,73,0.6)] transition-transform hover:scale-105 active:scale-95"
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
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            style={{ opacity: shown ? 1 : 0, transition: "opacity .4s var(--ease-drawer)" }}
          />
          {/* sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add entry"
            className="glass glass-2 relative w-full max-w-md rounded-t-card p-6 pb-7 sm:rounded-card"
            style={{
              transform: shown ? "translateY(0)" : "translateY(100%)",
              transition: "transform .4s var(--ease-drawer)",
            }}
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-pill bg-surface-2 sm:hidden" />

            <div className="space-y-5">
              {/* Income / Expense toggle */}
              <div className="grid grid-cols-2 gap-1 rounded-[12px] bg-surface-2 p-1">
                {(["income", "expense"] as Kind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setKind(k);
                      setCatIndex(0);
                      setSrcIndex(0);
                      setCustomSource("");
                    }}
                    className={`rounded-[9px] py-2 text-sm font-medium capitalize transition-colors ${
                      kind === k ? "bg-accent text-[#14100E]" : "text-muted"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* Month */}
              <div>
                <p className="eyebrow mb-2">For</p>
                <div className="flex items-center justify-between rounded-[10px] bg-surface-2 px-2 py-1.5">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setMonth(shiftYm(month, -1))}
                    className="grid size-9 place-items-center rounded-[8px] text-muted transition-colors hover:bg-surface hover:text-ink"
                  >
                    <Chevron dir="left" />
                  </button>
                  <span className="text-sm font-medium text-ink">
                    {ymLabel(month)}
                  </span>
                  <button
                    type="button"
                    aria-label="Next month"
                    disabled={atCurrentMonth}
                    onClick={() => !atCurrentMonth && setMonth(shiftYm(month, 1))}
                    className="grid size-9 place-items-center rounded-[8px] text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
                  >
                    <Chevron dir="right" />
                  </button>
                </div>
              </div>

              {/* Sheet tab name (owner only, income only): names or renames the
                  Google Sheet month tab; free-form so abbreviations work. */}
              {isOwner && kind === "income" && (
                <div>
                  <p className="eyebrow mb-2">Sheet tab name</p>
                  <input
                    value={effectiveTab}
                    onChange={(e) => {
                      setTabTitle(e.target.value);
                      setTabEdited(true);
                    }}
                    placeholder="e.g. Sept 2025"
                    className="h-11 w-full rounded-[10px] bg-surface-2 px-4 text-sm text-ink outline-none placeholder:text-faint"
                  />
                  <p className="mt-1.5 text-[11px] text-faint">
                    Name the month&rsquo;s tab your way. Created if new, renamed if it exists.
                  </p>
                </div>
              )}

              {/* Amount */}
              <div>
                <p className="eyebrow mb-2">Amount</p>
                <div className="flex h-16 items-center gap-3 rounded-[10px] bg-surface-2 px-5">
                  <span className="font-display text-2xl text-muted">₹</span>
                  <input
                    autoFocus
                    inputMode="numeric"
                    value={grouped}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="0"
                    className="font-display tnum h-full w-full bg-transparent px-1 text-3xl text-ink outline-none placeholder:text-faint"
                  />
                </div>
              </div>

              {/* Source / Category */}
              <div>
                <p className="eyebrow mb-2">
                  {kind === "income" ? "Source" : "Category"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {chips.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setChip(i)}
                      className={`tap rounded-[9px] px-3.5 py-2 text-sm ring-1 transition-colors ${
                        activeChip === i
                          ? "bg-surface-2 text-ink ring-accent"
                          : "text-muted ring-edge hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {isOther && (
                  <input
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="Name this source"
                    className="mt-2.5 h-11 w-full rounded-[10px] bg-surface-2 px-4 text-sm text-ink outline-none placeholder:text-faint"
                  />
                )}
              </div>

              {/* Note */}
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional)"
                className="h-11 w-full rounded-[10px] bg-surface-2 px-4 text-sm text-ink outline-none placeholder:text-faint"
              />
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!valid || saving}
              className="mt-6 h-12 w-full rounded-[10px] bg-accent text-base font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(205,163,73,0.7)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
            >
              {saving ? "Adding…" : `Add ${kind}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
