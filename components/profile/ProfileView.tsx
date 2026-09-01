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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 21l-5.2 2.7 1-5.8L3.6 8.1l5.8-.8L12 2z"
                    fill={data.tier.color}
                    opacity="0.9"
                  />
                </svg>
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
