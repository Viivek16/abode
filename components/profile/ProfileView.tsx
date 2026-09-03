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

// The engraved emblem per tier, drawn in a 0..24 box (centred by the badge).
// Each is a single clear metaphor — line-based, geometric, premium.
function tierSymbol(tierKey: string) {
  switch (tierKey) {
    case "strategist": // precision — a crosshair on target
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="3.6" />
          <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
          <circle cx="12" cy="12" r="1" fill="#fff" stroke="none" />
        </>
      );
    case "saver": // safety net — a shield with a check
      return (
        <>
          <path d="M12 3.2l7 2.4v5c0 4.4-3 7.4-7 8.9-4-1.5-7-4.5-7-8.9v-5l7-2.4z" />
          <path d="M9 12l2.1 2.1L15 10" />
        </>
      );
    case "spender": // free spirit — a four-point sparkle
      return (
        <path d="M12 2.5c.4 4.6 1.9 6.1 6.5 6.5-4.6.4-6.1 1.9-6.5 6.5-.4-4.6-1.9-6.1-6.5-6.5 4.6-.4 6.1-1.9 6.5-6.5z" />
      );
    case "risk-taker": // energy / risk — a bolt
      return <path d="M13 2.5L5 13.5h5.5L9.5 21.5 19 10.5h-5.5l0.5-8z" />;
    default: // builder — a rising trend line, on-brand with Abode's ascent
      return (
        <>
          <path d="M3 16.5L9 11l4 3 7-8" />
          <path d="M15 6h5v5" />
        </>
      );
  }
}

// A premium tier crest: a portrait plaque (taller than wide, so it fills the
// vertical space beside the title) in the tier colour, lit from the top-left
// with a radial + specular sheen, twin engraved rims, and the emblem embossed
// in white. The emblem itself stays square — the plaque, not the icon, elongates.
function TierBadge({ tierKey, color }: { tierKey: string; color: string }) {
  const k = tierKey;
  return (
    <svg viewBox="0 0 60 76" className="h-[4.75rem] w-auto shrink-0 drop-shadow-[0_9px_18px_rgba(0,0,0,0.5)]" aria-hidden>
      <defs>
        <radialGradient id={`tb-face-${k}`} cx="32%" cy="20%" r="92%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.62" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id={`tb-glow-${k}`} cx="50%" cy="46%" r="60%">
          <stop offset="48%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id={`tb-soft-${k}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id={`tb-emb-${k}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.7" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>
      {/* soft tier-coloured aura */}
      <rect x="2" y="4" width="56" height="70" rx="19" fill={`url(#tb-glow-${k})`} filter={`url(#tb-soft-${k})`} />
      {/* plaque face + top-left sheen */}
      <rect x="6" y="6" width="48" height="64" rx="16" fill={color} />
      <rect x="6" y="6" width="48" height="64" rx="16" fill={`url(#tb-face-${k})`} />
      {/* specular highlight, upper-left */}
      <ellipse cx="23" cy="22" rx="13" ry="8.5" fill="#ffffff" opacity="0.16" filter={`url(#tb-soft-${k})`} />
      {/* rims: bright outer edge, engraved inner frame */}
      <rect x="6" y="6" width="48" height="64" rx="16" fill="none" stroke="#ffffff" strokeOpacity="0.36" strokeWidth="1" />
      <rect x="9.5" y="9.5" width="41" height="57" rx="12.5" fill="none" stroke="#000000" strokeOpacity="0.16" strokeWidth="1" />
      <rect x="11" y="11" width="38" height="54" rx="11" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="0.75" />
      {/* embossed emblem, centred in a 0..24 box */}
      <g
        transform="translate(18 26)"
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
  const [showInfo, setShowInfo] = useState(false);

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
                <p className="font-display mt-0.5 text-[1.7rem] font-semibold leading-none text-ink">{data.tier.name}</p>
                <p className="mt-1.5 text-sm text-muted">{data.tier.blurb}</p>
              </div>
            </div>
          </section>

          {/* Timeline — both labels are two words (one line), so the tiles are the
              same height and their values align without any pinning. */}
          <section className="grid grid-cols-2 gap-2">
            {[
              { label: "Member since", value: data.userSince ?? "—" },
              { label: "Tracking since", value: data.financeSince ?? "Not yet" },
            ].map((t) => (
              <div key={t.label} className="glass p-4">
                <p className="eyebrow">{t.label}</p>
                <p className="font-display mt-1 text-lg font-semibold text-ink">{t.value}</p>
              </div>
            ))}
          </section>

          {/* Behaviour */}
          <section className="glass p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">How you handle money</p>
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                aria-expanded={showInfo}
                aria-label="What do these figures mean?"
                className="tap grid size-6 place-items-center rounded-pill text-muted ring-1 ring-edge transition-colors hover:text-ink hover:ring-edge-strong"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 11v5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="12" cy="7.6" r="1.15" fill="currentColor" />
                </svg>
              </button>
            </div>
            {showInfo && (
              <div className="pop-in mb-4 rounded-[12px] bg-surface-2/70 p-3.5 text-xs leading-relaxed text-muted ring-1 ring-edge">
                <p>
                  These are your <span className="text-ink">all-time</span> totals — every month you&rsquo;ve
                  tracked, added together, not just this one.
                </p>
                <ul className="mt-2 space-y-1">
                  <li><span className="text-ink">Invested</span> — income you&rsquo;ve moved into investing.</li>
                  <li><span className="text-ink">Saved</span> — income set aside rather than spent.</li>
                  <li><span className="text-ink">Spent</span> — everything logged as an expense.</li>
                </ul>
                <p className="mt-2">
                  Each % is that total as a share of all the income you&rsquo;ve earned. They won&rsquo;t add
                  up to 100% — the rest is still unallocated or sitting in other pots.
                </p>
              </div>
            )}
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
