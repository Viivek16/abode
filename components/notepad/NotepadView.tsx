"use client";

import Link from "next/link";
import { useState } from "react";
import { rupee } from "@/lib/format";
import {
  useNotepad,
  useSaveNotepad,
  withTotals,
  type FundManager,
  type LineItem,
  type NotepadData,
} from "@/lib/hooks/useNotepad";

type LineSection = "big_buys" | "lending" | "studio";

/* ---------- small field primitives (match the app's input styling) ---------- */

function TextInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-9 rounded-[8px] bg-surface-2 px-3 text-sm text-ink outline-none ring-1 ring-edge focus:ring-accent placeholder:text-faint ${className}`}
    />
  );
}

function NumInput({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex h-9 items-center gap-1 rounded-[8px] bg-surface-2 px-3 ring-1 ring-edge focus-within:ring-accent ${className}`}
    >
      <span className="text-xs text-faint">₹</span>
      <input
        inputMode="numeric"
        value={value ? value.toLocaleString("en-IN") : ""}
        onChange={(e) => onChange(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
        placeholder="0"
        className="tnum w-full bg-transparent text-right text-sm text-ink outline-none placeholder:text-faint"
      />
    </div>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Remove"
      onClick={onClick}
      className="tap grid size-9 shrink-0 place-items-center rounded-[8px] text-faint ring-1 ring-edge transition-colors hover:text-negative hover:ring-edge-strong"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap mt-3 w-full rounded-[10px] border border-dashed border-edge-strong py-2.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
    >
      + {label}
    </button>
  );
}

function Section({
  title,
  total,
  children,
}: {
  title: string;
  total?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card bg-surface p-5 ring-1 ring-edge">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="eyebrow">{title}</p>
        {total != null && (
          <span className="font-display tnum text-sm font-semibold text-accent">
            {rupee(total)}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

// name / date / amount rows with add + remove (declared at module scope so its
// inputs keep focus across edits).
function LineTable({
  items,
  onSet,
  onRemove,
  addLabel,
  onAdd,
}: {
  items: LineItem[];
  onSet: (i: number, patch: Partial<LineItem>) => void;
  onRemove: (i: number) => void;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <>
      <div className="space-y-2">
        {items.length === 0 && <p className="py-1 text-sm text-faint">Nothing here yet.</p>}
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={it.name}
              onChange={(v) => onSet(i, { name: v })}
              placeholder="Item"
              className="min-w-0 flex-1"
            />
            <TextInput
              value={it.date ?? ""}
              onChange={(v) => onSet(i, { date: v })}
              placeholder="dd/mm/yyyy"
              className="w-28 shrink-0"
            />
            <NumInput value={it.amount} onChange={(n) => onSet(i, { amount: n })} className="w-28 shrink-0" />
            <DeleteButton onClick={() => onRemove(i)} />
          </div>
        ))}
      </div>
      <AddButton label={addLabel} onClick={onAdd} />
    </>
  );
}

/* ---------- the view ---------- */

export default function NotepadView() {
  const { data, isLoading } = useNotepad();
  const save = useSaveNotepad();
  // Local edits, if any, override the server copy. null = no unsaved edits.
  const [draft, setDraft] = useState<NotepadData | null>(null);

  const working = draft ?? data ?? null;
  const dirty = draft != null;

  if (isLoading || !working) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-5">
        <p className="text-sm text-faint">Loading…</p>
      </main>
    );
  }

  const live = withTotals(working); // totals recomputed for display

  /* line-item section helpers */
  const setLine = (s: LineSection, i: number, patch: Partial<LineItem>) =>
    setDraft({
      ...working,
      [s]: { ...working[s], items: working[s].items.map((it, x) => (x === i ? { ...it, ...patch } : it)) },
    });
  const addLine = (s: LineSection) =>
    setDraft({ ...working, [s]: { ...working[s], items: [...working[s].items, { name: "", date: "", amount: 0 }] } });
  const removeLine = (s: LineSection, i: number) =>
    setDraft({ ...working, [s]: { ...working[s], items: working[s].items.filter((_, x) => x !== i) } });

  /* fund-manager helpers */
  const setFm = (i: number, patch: Partial<FundManager>) =>
    setDraft({ ...working, fund_managers: working.fund_managers.map((f, x) => (x === i ? { ...f, ...patch } : f)) });
  const addFm = () =>
    setDraft({
      ...working,
      fund_managers: [
        ...working.fund_managers,
        { name: "", type: "", platform: "", split: "", amount: 0, date: "", maturity: "", returns: "" },
      ],
    });
  const removeFm = (i: number) =>
    setDraft({ ...working, fund_managers: working.fund_managers.filter((_, x) => x !== i) });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="font-display text-lg font-bold text-ink">Abode</p>
          <Link href="/" className="text-xs text-muted hover:text-ink">
            Dashboard
          </Link>
          <span className="text-xs font-medium text-accent">Notepad</span>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-pill px-3 py-2 text-xs text-muted ring-1 ring-edge hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </header>

      <h1 className="font-display mb-1 text-2xl font-bold text-ink">Notepad</h1>
      <p className="mb-5 text-sm text-muted">
        Fund managers, big buys, studio setup, and lending. Everything here is yours to edit.
      </p>

      <div className="space-y-4">
        {/* Fund managers */}
        <Section title="Fund managers">
          <div className="space-y-3">
            {working.fund_managers.length === 0 && (
              <p className="py-1 text-sm text-faint">No fund managers yet.</p>
            )}
            {working.fund_managers.map((fm, i) => (
              <div key={i} className="rounded-button bg-surface-2 p-3.5">
                <div className="mb-2 flex items-center gap-2">
                  <TextInput
                    value={fm.name}
                    onChange={(v) => setFm(i, { name: v })}
                    placeholder="Name"
                    className="min-w-0 flex-1 !bg-surface"
                  />
                  <NumInput value={fm.amount} onChange={(n) => setFm(i, { amount: n })} className="w-32 shrink-0 !bg-surface" />
                  <DeleteButton onClick={() => removeFm(i)} />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <TextInput value={fm.type} onChange={(v) => setFm(i, { type: v })} placeholder="Type" className="!bg-surface" />
                  <TextInput value={fm.platform} onChange={(v) => setFm(i, { platform: v })} placeholder="Platform" className="!bg-surface" />
                  <TextInput value={fm.split} onChange={(v) => setFm(i, { split: v })} placeholder="Split" className="!bg-surface" />
                  <TextInput value={fm.date} onChange={(v) => setFm(i, { date: v })} placeholder="Invested" className="!bg-surface" />
                  <TextInput value={fm.maturity} onChange={(v) => setFm(i, { maturity: v })} placeholder="Matures" className="!bg-surface" />
                  <TextInput value={fm.returns} onChange={(v) => setFm(i, { returns: v })} placeholder="Returns" className="!bg-surface" />
                </div>
              </div>
            ))}
          </div>
          <AddButton label="Add fund manager" onClick={addFm} />
        </Section>

        {/* Big buys */}
        <Section title="Big buys" total={live.big_buys.total}>
          <LineTable
            items={working.big_buys.items}
            onSet={(i, p) => setLine("big_buys", i, p)}
            onRemove={(i) => removeLine("big_buys", i)}
            addLabel="Add big buy"
            onAdd={() => addLine("big_buys")}
          />
        </Section>

        {/* Studio setup */}
        <Section title="Studio setup" total={live.studio.total}>
          <LineTable
            items={working.studio.items}
            onSet={(i, p) => setLine("studio", i, p)}
            onRemove={(i) => removeLine("studio", i)}
            addLabel="Add studio item"
            onAdd={() => addLine("studio")}
          />
        </Section>

        {/* Lending */}
        <Section title="Lending" total={live.lending.total}>
          <LineTable
            items={working.lending.items}
            onSet={(i, p) => setLine("lending", i, p)}
            onRemove={(i) => removeLine("lending", i)}
            addLabel="Add lending"
            onAdd={() => addLine("lending")}
          />
        </Section>
      </div>

      {/* Sticky save bar (only when there are unsaved edits) */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-bg/90 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              disabled={save.isPending}
              className="tap rounded-[10px] px-4 py-2.5 text-sm text-muted ring-1 ring-edge hover:text-ink disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={async () => {
                await save.mutateAsync(working);
                setDraft(null);
              }}
              disabled={save.isPending}
              className="tap rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(205,163,73,0.7)] transition-all hover:brightness-105 disabled:opacity-50"
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
