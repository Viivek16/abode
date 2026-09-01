"use client";

import Link from "next/link";
import { useState } from "react";
import { rupee } from "@/lib/format";
import { InlineText, InlineAmount, RemoveButton } from "@/components/ui/InlineEdit";
import ProfileButton from "@/components/profile/ProfileButton";
import {
  useNotepad,
  useSaveNotepad,
  withTotals,
  type FundManager,
  type LineItem,
  type NotepadData,
} from "@/lib/hooks/useNotepad";

type LineSection = "big_buys" | "lending" | "studio";

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

  const live = withTotals(working);

  const setLine = (s: LineSection, i: number, patch: Partial<LineItem>) =>
    setDraft({
      ...working,
      [s]: { ...working[s], items: working[s].items.map((it, x) => (x === i ? { ...it, ...patch } : it)) },
    });
  const addLine = (s: LineSection) =>
    setDraft({ ...working, [s]: { ...working[s], items: [...working[s].items, { name: "", date: "", amount: 0 }] } });
  const removeLine = (s: LineSection, i: number) =>
    setDraft({ ...working, [s]: { ...working[s], items: working[s].items.filter((_, x) => x !== i) } });

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
        <ProfileButton />
      </header>

      <h1 className="font-display mb-1 text-2xl font-bold text-ink">Notepad</h1>
      <p className="mb-5 text-sm text-muted">
        Tap any underlined name, date or amount to edit it. Tap × to remove a row.
      </p>

      <div className="space-y-4">
        {/* Fund managers */}
        <Section title="Fund managers">
          <div className="space-y-3">
            {working.fund_managers.length === 0 && (
              <p className="py-1 text-sm text-faint">No fund managers yet.</p>
            )}
            {working.fund_managers.map((fm, i) => (
              <div key={i} className="group rounded-button bg-surface-2 p-4 transition-shadow focus-within:ring-1 focus-within:ring-edge-strong">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <InlineText
                      value={fm.name}
                      onCommit={(v) => setFm(i, { name: v })}
                      placeholder="Name"
                      grow
                      className="font-medium text-ink"
                    />
                  </div>
                  <span className="flex items-center gap-2">
                    <InlineAmount value={fm.amount} onCommit={(n) => setFm(i, { amount: n })} className="text-sm text-accent" />
                    <RemoveButton onClick={() => removeFm(i)} />
                  </span>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-muted">
                  <InlineText value={fm.type} onCommit={(v) => setFm(i, { type: v })} placeholder="Type" />
                  <span className="text-faint">·</span>
                  <InlineText value={fm.platform} onCommit={(v) => setFm(i, { platform: v })} placeholder="Platform" />
                  <span className="text-faint">·</span>
                  <InlineText value={fm.split} onCommit={(v) => setFm(i, { split: v })} placeholder="Split" />
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-faint">
                  <span className="flex items-center gap-1">
                    Invested
                    <InlineText value={fm.date} onCommit={(v) => setFm(i, { date: v })} placeholder="date" />
                  </span>
                  <span className="flex items-center gap-1">
                    Matures
                    <InlineText value={fm.maturity} onCommit={(v) => setFm(i, { maturity: v })} placeholder="date" />
                  </span>
                  <span className="flex items-center gap-1">
                    Returns
                    <InlineText value={fm.returns} onCommit={(v) => setFm(i, { returns: v })} placeholder="add" />
                  </span>
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
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
            <span className="text-xs text-muted">Unsaved changes</span>
            <div className="flex items-center gap-2">
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
        </div>
      )}
    </main>
  );
}
