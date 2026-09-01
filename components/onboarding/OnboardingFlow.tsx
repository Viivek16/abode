"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { rupee } from "@/lib/format";
import {
  useFinishOnboarding,
  useNeedsOnboarding,
  type Split,
} from "@/lib/hooks/useOnboarding";

const BUCKETS: { key: keyof Split; label: string; color: string }[] = [
  { key: "bills", label: "Bills + Savings", color: "var(--bucket-bills)" },
  { key: "invest", label: "Investments", color: "var(--bucket-invest)" },
  { key: "emergency", label: "Emergency", color: "var(--bucket-emergency)" },
  { key: "personal", label: "Personal", color: "var(--bucket-personal)" },
];

type Preset = {
  id: string;
  name: string;
  tagline: string;
  note: string;
  fact: string;
  split: Split | null; // null = custom
};

const PRESETS: Preset[] = [
  {
    id: "golden",
    name: "The Golden Ratio",
    tagline: "40 · 30 · 15 · 15",
    note: "Bills 40, Investments 30, Emergency 15, Personal 15.",
    fact: "The classic. Most people start their money map right here.",
    split: { bills: 40, invest: 30, emergency: 15, personal: 15 },
  },
  {
    id: "thirds",
    name: "Fifty · Thirty · Twenty",
    tagline: "50 · 30 · 20",
    note: "Bills 50, Investments 30, Emergency 20.",
    fact: "Clean and disciplined, a favourite of the no-fuss crowd.",
    split: { bills: 50, invest: 30, emergency: 20, personal: 0 },
  },
  {
    id: "growth",
    name: "Growth-First",
    tagline: "30 · 45 · 15 · 10",
    note: "Bills 30, Investments 45, Emergency 15, Personal 10.",
    fact: "Bold. You are putting your money to work harder.",
    split: { bills: 30, invest: 45, emergency: 15, personal: 10 },
  },
  {
    id: "custom",
    name: "Custom",
    tagline: "Pick your own",
    note: "You choose every slice; the four just have to add up to 100.",
    fact: "Built by you, for you. The truest fit.",
    split: null,
  },
];

// Fixed-expense categories. Multi categories reveal sub-options you can add
// several of; single categories are just one amount.
type FxCat = { key: string; label: string; multi: boolean; subs: string[] };
const FX_CATS: FxCat[] = [
  { key: "rent", label: "Rent", multi: false, subs: [] },
  { key: "loan", label: "Loan", multi: true, subs: ["Car loan", "House loan", "SIP", "Other"] },
  { key: "investment", label: "Investment", multi: false, subs: [] },
  { key: "utilities", label: "Utilities", multi: false, subs: [] },
  { key: "other", label: "Other", multi: true, subs: [] },
];

type Fx = { id: string; cat: string; label: string; amount: number };

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Math.random());

function Dots({ split }: { split: Split }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
      {BUCKETS.map((b) => (
        <span key={b.key} className="flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block size-2.5 rounded-pill" style={{ background: b.color }} />
          {b.label} {split[b.key]}%
        </span>
      ))}
    </div>
  );
}

function SplitBar({ split }: { split: Split }) {
  const total = BUCKETS.reduce((s, b) => s + (split[b.key] || 0), 0) || 1;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-pill bg-surface-2">
      {BUCKETS.map((b) =>
        split[b.key] > 0 ? (
          <span key={b.key} style={{ width: `${(split[b.key] / total) * 100}%`, background: b.color }} />
        ) : null,
      )}
    </div>
  );
}

function FxAmount({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex h-9 w-28 shrink-0 items-center gap-1 rounded-[8px] bg-surface-2 px-3 ring-1 ring-edge focus-within:ring-accent">
      <span className="text-xs text-faint">₹</span>
      <input
        inputMode="numeric"
        value={value ? value.toLocaleString("en-IN") : ""}
        onChange={(e) => onChange(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)}
        placeholder="0"
        className="tnum w-full bg-transparent px-0.5 text-right text-sm text-ink outline-none placeholder:text-faint"
      />
    </div>
  );
}

export default function OnboardingFlow() {
  const router = useRouter();
  const { data: needsOnboarding, isLoading } = useNeedsOnboarding();
  const finish = useFinishOnboarding();

  const [step, setStep] = useState(0);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [custom, setCustom] = useState<Split>({ bills: 40, invest: 30, emergency: 15, personal: 15 });
  const [income, setIncome] = useState("");

  // Fixed expenses (step 2)
  const [fixed, setFixed] = useState<Fx[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && needsOnboarding === false) router.replace("/");
  }, [isLoading, needsOnboarding, router]);

  const preset = PRESETS.find((p) => p.id === presetId) ?? null;
  const split: Split = preset?.split ?? custom;
  const customTotal = custom.bills + custom.invest + custom.emergency + custom.personal;
  const step0Valid = preset != null && (preset.id !== "custom" || customTotal === 100);

  const incomeNum = useMemo(() => parseInt(income.replace(/\D/g, ""), 10) || 0, [income]);

  const catRows = (cat: string) => fixed.filter((r) => r.cat === cat);
  const catTotal = (cat: string) => catRows(cat).reduce((s, r) => s + r.amount, 0);
  const fixedTotal = fixed.reduce((s, r) => s + r.amount, 0);

  const isActive = (c: FxCat) => (c.multi ? expanded.includes(c.key) : catRows(c.key).length > 0);
  const toggleCat = (c: FxCat) => {
    if (c.multi) {
      setExpanded((e) => (e.includes(c.key) ? e.filter((k) => k !== c.key) : [...e, c.key]));
    } else if (catRows(c.key).length) {
      setFixed((f) => f.filter((r) => r.cat !== c.key));
    } else {
      setFixed((f) => [...f, { id: uid(), cat: c.key, label: c.label, amount: 0 }]);
    }
  };
  const addRow = (cat: string, label: string) =>
    setFixed((f) => [...f, { id: uid(), cat, label, amount: 0 }]);
  const setAmount = (id: string, n: number) =>
    setFixed((f) => f.map((r) => (r.id === id ? { ...r, amount: n } : r)));
  const setLabel = (id: string, v: string) =>
    setFixed((f) => f.map((r) => (r.id === id ? { ...r, label: v } : r)));
  const removeRow = (id: string) => setFixed((f) => f.filter((r) => r.id !== id));

  async function complete() {
    await finish.mutateAsync({
      split,
      fixed: fixed.map((r) => ({ label: r.label, amount: r.amount })),
    });
    router.push("/");
  }

  if (isLoading || needsOnboarding === false) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-faint">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-8">
      {/* progress */}
      <div className="mb-7 flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-pill transition-colors"
            style={{ background: i <= step ? "var(--accent)" : "var(--surface-2)" }}
          />
        ))}
      </div>

      {/* STEP 1: choose a model */}
      {step === 0 && (
        <div className="reveal flex flex-1 flex-col">
          <p className="eyebrow">Step 1 of 4</p>
          <h1 className="font-display mt-2 text-3xl font-semibold leading-tight text-ink">
            How do you want to manage your money?
          </h1>
          <p className="mt-2 mb-6 text-sm text-muted">
            Pick a model. Every rupee of income is split into these buckets automatically.
          </p>

          <div className="space-y-3">
            {PRESETS.map((p) => {
              const active = presetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetId(p.id)}
                  className={`tap w-full rounded-card p-4 text-left ring-1 transition-colors ${
                    active ? "bg-surface-2 ring-accent" : "bg-surface ring-edge hover:ring-edge-strong"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-lg font-semibold text-ink">{p.name}</span>
                    <span className="tnum text-xs text-accent">{p.tagline}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{p.note}</p>
                  {p.split && active && <Dots split={p.split} />}
                </button>
              );
            })}
          </div>

          {presetId === "custom" && (
            <div className="mt-4 rounded-card bg-surface p-4 ring-1 ring-edge">
              <div className="grid grid-cols-2 gap-3">
                {BUCKETS.map((b) => (
                  <label key={b.key} className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <span className="inline-block size-2.5 rounded-pill" style={{ background: b.color }} />
                      {b.label}
                    </span>
                    <div className="flex h-10 items-center gap-1 rounded-[8px] bg-surface-2 px-3 ring-1 ring-edge focus-within:ring-accent">
                      <input
                        inputMode="numeric"
                        value={custom[b.key] ? String(custom[b.key]) : ""}
                        onChange={(e) =>
                          setCustom((c) => ({
                            ...c,
                            [b.key]: Math.min(100, parseInt(e.target.value.replace(/\D/g, ""), 10) || 0),
                          }))
                        }
                        placeholder="0"
                        className="tnum w-full bg-transparent text-right text-sm text-ink outline-none placeholder:text-faint"
                      />
                      <span className="text-xs text-faint">%</span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <SplitBar split={custom} />
                <p className={`mt-2 text-xs ${customTotal === 100 ? "text-positive" : "text-negative"}`}>
                  Total {customTotal}% {customTotal === 100 ? "· perfect" : "· must add up to 100%"}
                </p>
              </div>
            </div>
          )}

          <div className="mt-auto pt-6">
            <button
              type="button"
              disabled={!step0Valid}
              onClick={() => setStep(1)}
              className="h-12 w-full rounded-[10px] bg-accent text-base font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(205,163,73,0.7)] transition-all hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: fixed expenses (Notion-style) */}
      {step === 1 && (
        <div className="reveal flex flex-1 flex-col">
          <p className="eyebrow">Step 2 of 4</p>
          <h1 className="font-display mt-2 text-3xl font-semibold leading-tight text-ink">
            What are your fixed expenses?
          </h1>
          <p className="mt-2 mb-6 text-sm text-muted">
            Pick the ones that apply and add amounts. These are counted as spent each month.
          </p>

          <div className="space-y-3">
            {FX_CATS.map((c) => {
              const active = isActive(c);
              const rows = catRows(c.key);
              const total = catTotal(c.key);
              return (
                <div key={c.key} className="overflow-hidden rounded-card bg-surface ring-1 ring-edge">
                  <button
                    type="button"
                    onClick={() => toggleCat(c)}
                    className="tap flex w-full items-center justify-between p-4"
                  >
                    <span className="font-medium text-ink">{c.label}</span>
                    <span className={`tnum text-sm ${total > 0 ? "text-accent" : active ? "text-muted" : "text-faint"}`}>
                      {total > 0 ? rupee(total) : active ? "Added" : "+ Add"}
                    </span>
                  </button>

                  {active && (
                    <div className="space-y-2 border-t border-edge p-4 pt-3">
                      {c.multi && c.subs.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {c.subs.map((sub) => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => addRow(c.key, sub === "Other" ? "" : sub)}
                              className="tap rounded-[8px] px-3 py-1.5 text-xs text-muted ring-1 ring-edge transition-colors hover:text-ink hover:ring-edge-strong"
                            >
                              + {sub}
                            </button>
                          ))}
                        </div>
                      )}
                      {c.key === "other" && (
                        <button
                          type="button"
                          onClick={() => addRow("other", "")}
                          className="tap rounded-[8px] px-3 py-1.5 text-xs text-muted ring-1 ring-edge transition-colors hover:text-ink hover:ring-edge-strong"
                        >
                          + Add item
                        </button>
                      )}

                      {rows.map((r) => {
                        const editable = c.multi && !c.subs.includes(r.label);
                        return (
                          <div key={r.id} className="flex items-center gap-2">
                            {editable ? (
                              <input
                                value={r.label}
                                onChange={(e) => setLabel(r.id, e.target.value)}
                                placeholder="Name it"
                                className="h-9 min-w-0 flex-1 rounded-[8px] bg-surface-2 px-3 text-sm text-ink outline-none ring-1 ring-edge focus:ring-accent placeholder:text-faint"
                              />
                            ) : (
                              <span className="min-w-0 flex-1 truncate text-sm text-ink">{r.label}</span>
                            )}
                            <FxAmount value={r.amount} onChange={(n) => setAmount(r.id, n)} />
                            <button
                              type="button"
                              aria-label="Remove"
                              onClick={() => removeRow(r.id)}
                              className="tap grid size-9 shrink-0 place-items-center rounded-[8px] text-faint ring-1 ring-edge transition-colors hover:text-negative"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}

                      {c.multi && rows.length === 0 && (
                        <p className="text-xs text-faint">Pick what applies above.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-card bg-surface-2 px-4 py-3">
            <span className="text-sm text-muted">Total fixed / month</span>
            <span className="font-display tnum text-lg font-semibold text-ink">{rupee(fixedTotal)}</span>
          </div>

          <div className="mt-auto flex gap-2 pt-6">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="tap h-12 rounded-[10px] px-5 text-sm text-muted ring-1 ring-edge hover:text-ink"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="h-12 flex-1 rounded-[10px] bg-accent text-base font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(205,163,73,0.7)] transition-all hover:brightness-105"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: see it in action */}
      {step === 2 && (
        <div className="reveal flex flex-1 flex-col">
          <p className="eyebrow">Step 3 of 4</p>
          <h1 className="font-display mt-2 text-3xl font-semibold leading-tight text-ink">
            See your split in action
          </h1>
          <p className="mt-2 mb-6 text-sm text-muted">
            Type a monthly income and watch how it lands in each bucket.
          </p>

          <div className="rounded-card bg-surface p-5 ring-1 ring-edge">
            <p className="eyebrow mb-2">Example monthly income</p>
            <div className="flex h-16 items-center gap-3 rounded-[10px] bg-surface-2 px-5">
              <span className="font-display text-2xl text-muted">₹</span>
              <input
                autoFocus
                inputMode="numeric"
                value={incomeNum ? incomeNum.toLocaleString("en-IN") : ""}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="5,00,000"
                className="font-display tnum h-full w-full bg-transparent px-1 text-3xl text-ink outline-none placeholder:text-faint"
              />
            </div>

            <div className="mt-5">
              <SplitBar split={split} />
            </div>

            <div className="mt-4 space-y-2.5">
              {BUCKETS.map((b) => (
                <div key={b.key} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <span className="inline-block size-2.5 rounded-pill" style={{ background: b.color }} />
                    {b.label}
                    <span className="text-xs text-faint">{split[b.key]}%</span>
                  </span>
                  <span className="font-display tnum text-sm font-semibold text-ink">
                    {rupee(Math.round((split[b.key] / 100) * incomeNum))}
                  </span>
                </div>
              ))}
            </div>

            {fixedTotal > 0 && (
              <p className="mt-4 border-t border-edge pt-3 text-xs text-muted">
                Fixed expenses of{" "}
                <span className="tnum text-ink">{rupee(fixedTotal)}</span> are already set as spent.
              </p>
            )}
          </div>

          <div className="mt-auto flex gap-2 pt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="tap h-12 rounded-[10px] px-5 text-sm text-muted ring-1 ring-edge hover:text-ink"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="h-12 flex-1 rounded-[10px] bg-accent text-base font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(205,163,73,0.7)] transition-all hover:brightness-105"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: welcome */}
      {step === 3 && (
        <div className="reveal flex flex-1 flex-col items-center justify-center text-center">
          <div className="ambient glass glass-2 w-full rounded-card p-8">
            <p className="eyebrow">You are all set</p>
            <h1 className="font-display mt-3 text-3xl font-semibold leading-tight text-ink">
              Welcome to Abode
            </h1>
            <p className="mt-3 text-sm text-muted">
              You chose <span className="text-ink">{preset?.name}</span> ({preset?.tagline}).
              <br />
              {preset?.fact}
            </p>
            <div className="mt-6">
              <SplitBar split={split} />
              <Dots split={split} />
            </div>
            <button
              type="button"
              disabled={finish.isPending}
              onClick={complete}
              className="mt-8 h-12 w-full rounded-[10px] bg-accent text-base font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(205,163,73,0.7)] transition-all hover:brightness-105 disabled:opacity-50"
            >
              {finish.isPending ? "Setting up…" : "Enter my dashboard"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
