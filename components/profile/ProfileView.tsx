"use client";

import { useState } from "react";
import { rupee } from "@/lib/format";
import { useProfile } from "@/lib/hooks/useProfile";
import TopNav from "@/components/nav/TopNav";

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

// The engraved symbol per tier, in a 0..24 box (centred by the badge).
function tierSymbol(tierKey: string) {
  switch (tierKey) {
    case "strategist": // precision — a target
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1.1" fill="#fff" stroke="none" />
        </>
      );
    case "saver": // safety net — a shield with a check
      return (
        <>
          <path d="M12 3.2l7 2.4v5c0 4.4-3 7.4-7 8.9-4-1.5-7-4.5-7-8.9v-5l7-2.4z" />
          <path d="M9 12l2.1 2.1L15 10" />
        </>
      );
    case "spender": // free spirit — a spark
      return <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4L12 3z" />;
    case "risk-taker": // energy / risk — a bolt
      return <path d="M13 2.5L5 13.5h5.5L9.5 21.5 19 10.5h-5.5l0.5-8z" />;
    default: // builder — a stack of blocks
      return (
        <>
          <rect x="4" y="13.5" width="16" height="5.5" rx="1.4" />
          <rect x="6.5" y="8" width="11" height="5" rx="1.4" />
          <rect x="9" y="2.5" width="6" height="5" rx="1.4" />
        </>
      );
  }
}

// A premium coin-style medallion: the tier colour lit from top-left with a
// radial sheen and cast shadow for real depth, the symbol embossed in white.
function TierBadge({ tierKey, color }: { tierKey: string; color: string }) {
  const k = tierKey;
  return (
    <svg viewBox="0 0 56 56" className="size-14 shrink-0 drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]" aria-hidden>
      <defs>
        <radialGradient id={`tb-face-${k}`} cx="34%" cy="26%" r="82%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </radialGradient>
        <filter id={`tb-emb-${k}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.7" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>
      {/* coin face + top-left sheen */}
      <circle cx="28" cy="28" r="25" fill={color} />
      <circle cx="28" cy="28" r="25" fill={`url(#tb-face-${k})`} />
      {/* rim: bright top edge, dark inner bevel */}
      <circle cx="28" cy="28" r="25" fill="none" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="1" />
      <circle cx="28" cy="28" r="21" fill="none" stroke="#000000" strokeOpacity="0.14" strokeWidth="1" />
      {/* embossed symbol */}
      <g
        transform="translate(16 16)"
        stroke="#ffffff"
        strokeWidth="1.9"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#tb-emb-${k})`}
      >
        {tierSymbol(k)}
      </g>
    </svg>
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
      <TopNav />

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
              <TierBadge tierKey={data.tier.key} color={data.tier.color} />
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

          <form action="/auth/signout" method="post" className="flex justify-center pt-1">
            <button
              type="submit"
              className="tap inline-flex items-center gap-2 rounded-pill px-5 py-2.5 text-sm font-medium text-muted ring-1 ring-edge transition-colors hover:text-negative hover:ring-edge-strong"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M16 17l5-5-5-5M21 12H9M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
