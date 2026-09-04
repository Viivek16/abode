"use client";

import { useCallback, useEffect, useState } from "react";
import { rupee } from "@/lib/format";
import { InlineText, InlineAmount, RemoveButton } from "@/components/ui/InlineEdit";
import {
  useNotepad,
  useSaveNotepad,
  withTotals,
  type ChecklistItem,
  type LineItem,
  type NotepadData,
} from "@/lib/hooks/useNotepad";

type LineSection = "big_buys" | "lending";

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
      <div className="mb-2 flex items-baseline justify-between">
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

// Read-like list; tap a name, date or amount to edit it in place.
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
      <ul className="divide-y divide-[var(--edge)]">
        {items.length === 0 && <li className="py-2 text-sm text-faint">Nothing here yet.</li>}
        {items.map((it, i) => (
          <li
            key={i}
            className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors focus-within:bg-surface-2/60"
          >
            <div className="min-w-0 flex-1">
              <InlineText
                value={it.name}
                onCommit={(v) => onSet(i, { name: v })}
                placeholder="Item name"
                grow
                className="text-ink"
              />
            </div>
            <span className="flex items-center gap-2">
              <InlineText
                value={it.date ?? ""}
                onCommit={(v) => onSet(i, { date: v })}
                placeholder="add date"
                className="text-xs text-faint"
              />
              <InlineAmount value={it.amount} onCommit={(n) => onSet(i, { amount: n })} className="text-muted" />
              <RemoveButton onClick={() => onRemove(i)} />
            </span>
          </li>
        ))}
      </ul>
      <AddButton label={addLabel} onClick={onAdd} />
    </>
  );
}

export default function NotepadView({ active = true }: { active?: boolean }) {
  const { data, isLoading } = useNotepad();
  const save = useSaveNotepad();
  // Every edit pushes a full snapshot onto this stack; undo pops one off. The
  // stack is cleared on save/discard and on remount, so undo only ever rewinds
  // to the state the tab was opened in — never past it.
  const [history, setHistory] = useState<NotepadData[]>([]);

  const working = history[history.length - 1] ?? data ?? null;
  const dirty = history.length > 0;
  const pushDraft = useCallback((next: NotepadData) => setHistory((h) => [...h, next]), []);
  const undo = useCallback(() => setHistory((h) => h.slice(0, -1)), []);

  // Ctrl/Cmd+Z rewinds one edit — but only when the user isn't mid-typing in a
  // field, so native text undo keeps working inside inputs.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey)) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      e.preventDefault();
      undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  if (isLoading || !working) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-0">
        <p className="text-sm text-faint">Loading…</p>
      </main>
    );
  }

  const live = withTotals(working);

  const setLine = (s: LineSection, i: number, patch: Partial<LineItem>) =>
    pushDraft({
      ...working,
      [s]: { ...working[s], items: working[s].items.map((it, x) => (x === i ? { ...it, ...patch } : it)) },
    });
  const addLine = (s: LineSection) =>
    pushDraft({ ...working, [s]: { ...working[s], items: [...working[s].items, { name: "", date: "", amount: 0 }] } });
  const removeLine = (s: LineSection, i: number) =>
    pushDraft({ ...working, [s]: { ...working[s], items: working[s].items.filter((_, x) => x !== i) } });

  const setCheck = (i: number, patch: Partial<ChecklistItem>) =>
    pushDraft({ ...working, checklist: working.checklist.map((c, x) => (x === i ? { ...c, ...patch } : c)) });
  const addCheck = () =>
    pushDraft({ ...working, checklist: [...working.checklist, { text: "", done: false }] });
  const removeCheck = (i: number) =>
    pushDraft({ ...working, checklist: working.checklist.filter((_, x) => x !== i) });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-0">
      <h1 className="font-display mb-1 text-2xl font-bold text-ink">Notepad</h1>
      <p className="mb-5 text-sm text-muted">
        Tap any underlined value to edit it. Check items off, or tap × to remove a row.
      </p>

      <div className="space-y-4">
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

        {/* Checklist — open-ended reminders / to-dos, checked off when done */}
        <Section title="Checklist">
          <ul className="divide-y divide-[var(--edge)]">
            {working.checklist.length === 0 && (
              <li className="py-2 text-sm text-faint">Nothing to track yet.</li>
            )}
            {working.checklist.map((c, i) => (
              <li
                key={i}
                className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors focus-within:bg-surface-2/60"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={c.done}
                  aria-label={c.done ? "Mark not done" : "Mark done"}
                  onClick={() => setCheck(i, { done: !c.done })}
                  className={`tap grid size-5 shrink-0 place-items-center rounded-[6px] ring-1 transition-colors ${
                    c.done
                      ? "bg-accent text-[#14100E] ring-accent"
                      : "text-transparent ring-edge-strong hover:ring-accent"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <InlineText
                    value={c.text}
                    onCommit={(v) => setCheck(i, { text: v })}
                    placeholder="Add a note or reminder"
                    grow
                    className={`text-sm ${c.done ? "text-faint line-through" : "text-ink"}`}
                  />
                </div>
                <RemoveButton onClick={() => removeCheck(i)} />
              </li>
            ))}
          </ul>
          <AddButton label="Add item" onClick={addCheck} />
        </Section>
      </div>

      {/* Sticky save bar (only when there are unsaved edits, on the visible pane) */}
      {active && dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-bg/90 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={undo}
                disabled={save.isPending}
                aria-label="Undo last change"
                title="Undo (Ctrl+Z)"
                className="tap grid size-9 place-items-center rounded-pill text-muted ring-1 ring-edge transition-colors hover:text-ink hover:ring-edge-strong disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 9h11a5 5 0 0 1 0 10h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-xs text-muted">Unsaved changes</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistory([])}
                disabled={save.isPending}
                className="tap rounded-[10px] px-4 py-2.5 text-sm text-muted ring-1 ring-edge hover:text-ink disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={async () => {
                  await save.mutateAsync(working);
                  setHistory([]);
                }}
                disabled={save.isPending}
                className="tap rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(205,163,73,0.7)] transition-all hover:brightness-105 disabled:opacity-50"
              >
                {save.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
