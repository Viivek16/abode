"use client";

import Link from "next/link";
import { useState } from "react";
import { rupee } from "@/lib/format";
import { useProfile } from "@/lib/hooks/useProfile";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

function Avatar({ src, name }: { src: string | null; name: string }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="size-20 rounded-pill object-cover ring-1 ring-edge-strong"
      />
    );
  return (
    <span className="grid size-20 place-items-center rounded-pill bg-accent/15 font-display text-2xl font-semibold text-accent ring-1 ring-edge-strong">
      {initials(name)}
    </span>
  );
}

// A distinct, minimal line-mark per tier — drawn in the tier's own colour.
function TierIcon({ tierKey, color }: { tierKey: string; color: string }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (tierKey) {
    case "strategist": // precision — a target
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
        </svg>
      );
    case "saver": // safety net — a shield with a check
      return (
        <svg {...common}>
          <path d="M12 3.2l7 2.4v5c0 4.4-3 7.4-7 8.9-4-1.5-7-4.5-7-8.9v-5l7-2.4z" />
          <path d="M9 12l2.1 2.1L15 10" />
        </svg>
      );
    case "spender": // free spirit — a spark
      return (
        <svg {...common}>
          <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4L12 3z" />
          <circle cx="18.5" cy="17.5" r="1.15" fill={color} stroke="none" />
        </svg>
      );
    case "risk-taker": // energy / risk — a bolt
      return (
        <svg {...common}>
          <path d="M13 2.5L5 13.5h5.5L9.5 21.5 19 10.5h-5.5l0.5-8z" />
        </svg>
      );
    default: // builder — a stack of blocks
      return (
        <svg {...common}>
          <rect x="4" y="13.5" width="16" height="5.5" rx="1.4" />
          <rect x="6.5" y="8" width="11" height="5" rx="1.4" />
          <rect x="9" y="2.5" width="6" height="5" rx="1.4" />
        </svg>
      );
  }
}

function ShareBar({ label, value, income, color }: { label: string; value: number; income: number; color: string }) {
  const pct = income > 0 ? Math.min(Math.round((value / income) * 100), 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="flex items-center gap-2 text-sm text-ink">
          <span className="inline-block size-2.5 rounded-pill" style={{ background: color }} />
          {label}
        </span>
        <span className="tnum text-xs text-muted">
          {rupee(value)} <span className="text-faint">· {pct}%</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-pill bg-surface-2">
        <div
          className="h-full rounded-pill"
          style={{ width: `${pct}%`, background: color, transition: "width .9s cubic-bezier(.22,1,.36,1)" }}
        />
      </div>
    </div>
  );
}

export default function ProfileView() {
  const { data, isLoading } = useProfile();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-5">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="font-display text-lg font-bold text-ink">Abode</p>
          <Link href="/" className="text-xs text-muted hover:text-ink">
            Dashboard
          </Link>
          <Link href="/notepad" className="text-xs text-muted hover:text-ink">
            Notepad
          </Link>
          <span className="text-xs font-medium text-accent">Profile</span>
        </div>
      </header>

      {isLoading || !data ? (
        <p className="text-sm text-faint">Loading…</p>
      ) : (
        <div className="space-y-5">
          {/* Identity */}
          <section className="flex items-center gap-4">
            <Avatar src={data.avatar} name={data.name} />
            <div className="min-w-0">
              <h1 className="font-display truncate text-2xl font-semibold text-ink">{data.name}</h1>
              <p className="truncate text-sm text-muted">{data.email}</p>
            </div>
          </section>

          {/* Tier badge */}
          <section
            className="ambient glass glass-2 relative overflow-hidden p-6"
            style={{
              background: `radial-gradient(120% 120% at 12% 0%, color-mix(in oklab, ${data.tier.color} 22%, transparent), transparent 60%)`,
            }}
          >
            <div className="relative z-10 flex items-center gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-pill"
                style={{ background: `color-mix(in oklab, ${data.tier.color} 24%, transparent)`, boxShadow: `0 0 0 1px color-mix(in oklab, ${data.tier.color} 45%, transparent)` }}
              >
                <TierIcon tierKey={data.tier.key} color={data.tier.color} />
              </span>
              <div className="min-w-0">
                <p className="eyebrow">Your tier</p>
                <p className="font-display text-xl font-semibold text-ink">{data.tier.name}</p>
                <p className="mt-0.5 text-sm text-muted">{data.tier.blurb}</p>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="grid grid-cols-2 gap-3">
            <div className="glass p-4">
              <p className="eyebrow">Member since</p>
              <p className="font-display mt-1.5 text-lg font-semibold text-ink">{data.userSince ?? "—"}</p>
            </div>
            <div className="glass p-4">
              <p className="eyebrow">Managing finances since</p>
              <p className="font-display mt-1.5 text-lg font-semibold text-ink">{data.financeSince ?? "Not yet"}</p>
            </div>
          </section>

          {/* Behaviour */}
          <section className="glass p-6">
            <p className="eyebrow mb-4">How you handle money</p>
            {data.income > 0 ? (
              <div className="space-y-4">
                <ShareBar label="Invested" value={data.invest} income={data.income} color="var(--bucket-invest)" />
                <ShareBar label="Saved" value={data.save} income={data.income} color="var(--bucket-bills)" />
                <ShareBar label="Spent" value={data.spend} income={data.income} color="var(--negative)" />
              </div>
            ) : (
              <p className="text-sm text-faint">Add income and allocate it to see your money habits.</p>
            )}
          </section>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="tap w-full rounded-[12px] py-3 text-sm font-medium text-muted ring-1 ring-edge transition-colors hover:text-negative hover:ring-edge-strong"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
