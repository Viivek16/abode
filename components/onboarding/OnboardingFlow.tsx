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

// Proportional segmented bar of the split.
function SplitBar({ split }: { split: Split }) {
  const total = BUCKETS.reduce((s, b) => s + (split[b.key] || 0), 0) || 1;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-pill bg-surface-2">
      {BUCKETS.map((b) =>
        split[b.key] > 0 ? (
          <span
            key={b.key}
            style={{ width: `${(split[b.key] / total) * 100}%`, background: b.color }}
          />
        ) : null,
      )}
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

  // Owner / already-onboarded users never see this screen.
  useEffect(() => {
    if (!isLoading && needsOnboarding === false) router.replace("/");
  }, [isLoading, needsOnboarding, router]);

  const preset = PRESETS.find((p) => p.id === presetId) ?? null;
  const split: Split = preset?.split ?? custom;
  const customTotal = custom.bills + custom.invest + custom.emergency + custom.personal;
  const step0Valid = preset != null && (preset.id !== "custom" || customTotal === 100);

  const incomeNum = useMemo(() => parseInt(income.replace(/\D/g, ""), 10) || 0, [income]);

  async function complete() {
    await finish.mutateAsync(split);
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
        {[0, 1, 2].map((i) => (
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
          <p className="eyebrow">Step 1 of 3</p>
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

          {/* custom sliders */}
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
                <p
                  className={`mt-2 text-xs ${customTotal === 100 ? "text-positive" : "text-negative"}`}
                >
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

      {/* STEP 2: see it in action */}
      {step === 1 && (
        <div className="reveal flex flex-1 flex-col">
          <p className="eyebrow">Step 2 of 3</p>
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
                className="font-display tnum h-full w-full bg-transparent text-3xl text-ink outline-none placeholder:text-faint"
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

      {/* STEP 3: welcome */}
      {step === 2 && (
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
