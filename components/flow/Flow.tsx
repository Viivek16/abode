"use client";

import { useMemo, useSyncExternalStore } from "react";
import { rupee } from "@/lib/format";
import type { BucketKey, BucketView, Pot, Transfer } from "@/lib/types";

const MQ = "(prefers-reduced-motion: reduce)";
// Subscribe to the reduced-motion preference without setState-in-effect.
function useMotionOK() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(MQ);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => !window.matchMedia(MQ).matches,
    () => true,
  );
}

const W = 680;
const H = 384;
const TOP = 46; // headroom for the column captions + income amount
const AVAIL = H - TOP - 34;
const NODE = 9;
const GAP = 14;
const INCOME_X = 16;
const BUCKET_X = W / 2 - NODE / 2;
const POT_X = W - NODE - 16;

type Link = {
  d: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  from: string;
  to: string;
  bucket: BucketKey;
  amount: number;
  label: string;
  len: number;
};

function path(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}
const rough = (x1: number, y1: number, x2: number, y2: number) =>
  Math.abs(x2 - x1) + Math.abs(y2 - y1);

export default function Flow({
  earned,
  buckets,
  transfers,
  pots,
  selected,
  onSelect,
}: {
  earned: number;
  buckets: BucketView[];
  transfers: Transfer[];
  pots: Pot[];
  selected: BucketKey | null;
  onSelect: (k: BucketKey | null) => void;
}) {
  const motion = useMotionOK();

  const layout = useMemo(() => {
    const totalAlloc = buckets.reduce((s, b) => s + b.allocated, 0);
    if (totalAlloc <= 0) return null;

    const bucketAvail = AVAIL - (buckets.length - 1) * GAP;
    const k = bucketAvail / totalAlloc;
    const potById = new Map(pots.map((p) => [p.id, p]));

    const incomeY = TOP + (AVAIL - bucketAvail) / 2;
    const incomeNode = { x: INCOME_X, y: incomeY, h: bucketAvail };

    const bucketNodes: { b: BucketView; y: number; h: number; srcY: number }[] = [];
    let cyBucket = TOP;
    let cyIncome = incomeY;
    for (const b of buckets) {
      const h = b.allocated * k;
      bucketNodes.push({ b, y: cyBucket, h, srcY: cyIncome + h / 2 });
      cyBucket += h + GAP;
      cyIncome += h;
    }

    const inLinks: Link[] = bucketNodes.map((bn) => {
      const y1 = bn.srcY;
      const y2 = bn.y + bn.h / 2;
      return {
        d: path(INCOME_X + NODE, y1, BUCKET_X, y2),
        x1: INCOME_X + NODE,
        y1,
        x2: BUCKET_X,
        y2,
        width: Math.max(bn.h, 1.5),
        from: "var(--accent)",
        to: bn.b.color,
        bucket: bn.b.key,
        amount: bn.b.allocated,
        label: bn.b.name.replace(/ \(.*/, ""),
        len: rough(INCOME_X + NODE, y1, BUCKET_X, y2),
      };
    });

    const valid = transfers.filter((t) => t.pot_id && Number(t.amount) > 0);
    const order = new Map(buckets.map((b, i) => [b.key, i]));
    const potAgg = new Map<string, { received: number; rank: number }>();
    for (const t of valid) {
      const a = potAgg.get(t.pot_id!) ?? { received: 0, rank: order.get(t.quota_key as BucketKey) ?? 99 };
      a.received += Number(t.amount);
      potAgg.set(t.pot_id!, a);
    }
    const potIds = [...potAgg.keys()].sort((a, b) => potAgg.get(a)!.rank - potAgg.get(b)!.rank);

    const totalReceived = [...potAgg.values()].reduce((s, p) => s + p.received, 0);
    const potsHeight = totalReceived * k + Math.max(potIds.length - 1, 0) * GAP;
    let cyPot = Math.max(TOP, TOP + (AVAIL - potsHeight) / 2);
    const potNodes = new Map<string, { y: number; h: number; cum: number; name: string; color: string; amount: number }>();
    for (const id of potIds) {
      const received = potAgg.get(id)!.received;
      const h = received * k;
      const p = potById.get(id);
      potNodes.set(id, { y: cyPot, h, cum: cyPot, name: p?.name ?? "Pot", color: p?.color ?? "var(--muted)", amount: received });
      cyPot += h + GAP;
    }

    const bucketCum = new Map<BucketKey, number>();
    for (const bn of bucketNodes) bucketCum.set(bn.b.key, bn.y);
    const outLinks: Link[] = [];
    const ordered = [...valid].sort(
      (a, b) => (order.get(a.quota_key as BucketKey) ?? 99) - (order.get(b.quota_key as BucketKey) ?? 99),
    );
    for (const t of ordered) {
      const bk = t.quota_key as BucketKey;
      const w = Number(t.amount) * k;
      const sy = bucketCum.get(bk) ?? TOP;
      const pn = potNodes.get(t.pot_id!);
      if (!pn) continue;
      const py = pn.cum;
      const bucketName = buckets.find((b) => b.key === bk)?.name.replace(/ \(.*/, "") ?? bk;
      const color = buckets.find((b) => b.key === bk)?.color ?? "var(--muted)";
      const y1 = sy + w / 2;
      const y2 = py + w / 2;
      outLinks.push({
        d: path(BUCKET_X + NODE, y1, POT_X, y2),
        x1: BUCKET_X + NODE,
        y1,
        x2: POT_X,
        y2,
        width: Math.max(w, 1.5),
        from: color,
        to: pn.color,
        bucket: bk,
        amount: Number(t.amount),
        label: `${bucketName} → ${pn.name}`,
        len: rough(BUCKET_X + NODE, y1, POT_X, y2),
      });
      bucketCum.set(bk, sy + w);
      pn.cum = py + w;
    }

    return { incomeNode, bucketNodes, inLinks, outLinks, potNodes };
  }, [buckets, transfers, pots]);

  return (
    <section className="glass p-6">
      <p className="eyebrow mb-4">The flow</p>

      {!layout ? (
        <p className="py-10 text-center text-sm text-faint">
          Add income for this month to see the waterfall.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full overflow-visible"
          role="img"
          aria-label="Money flow from income into quota buckets and pots"
        >
          <defs>
            {[...layout.inLinks, ...layout.outLinks].map((l, i) => (
              <linearGradient key={i} id={`fl-${i}`} gradientUnits="userSpaceOnUse" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}>
                <stop offset="0" stopColor={l.from} />
                <stop offset="1" stopColor={l.to} />
              </linearGradient>
            ))}
          </defs>

          {/* column captions */}
          <text x={INCOME_X} y={22} className="eyebrow" fill="var(--faint)" fontSize="10" letterSpacing="1.5">INCOME</text>
          <text x={BUCKET_X + NODE / 2} y={22} textAnchor="middle" fill="var(--faint)" fontSize="10" letterSpacing="1.5">BUCKETS</text>
          <text x={POT_X + NODE} y={22} textAnchor="end" fill="var(--faint)" fontSize="10" letterSpacing="1.5">POTS</text>

          {/* ribbons */}
          {[layout.inLinks, layout.outLinks].map((group, gi) =>
            group.map((l, i) => {
              const idx = gi === 0 ? i : layout.inLinks.length + i;
              const dim = selected != null && selected !== l.bucket;
              const dur = Math.min(Math.max(l.len / 190, 2.4), 5).toFixed(1);
              return (
                <g key={`${gi}-${i}`} style={{ opacity: dim ? 0.06 : 1, transition: "opacity .35s" }}>
                  <path
                    d={l.d}
                    fill="none"
                    stroke={`url(#fl-${idx})`}
                    strokeWidth={l.width}
                    strokeLinecap="round"
                    opacity={0.5}
                  >
                    <title>{`${l.label}: ${rupee(l.amount)}`}</title>
                  </path>
                  {motion && !dim && (
                    <circle r={2.2} fill={l.to} opacity={0.9}>
                      <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={l.d} />
                    </circle>
                  )}
                </g>
              );
            }),
          )}

          {/* income node + amount */}
          <rect x={layout.incomeNode.x} y={layout.incomeNode.y} width={NODE} height={layout.incomeNode.h} rx={3} fill="var(--accent)" />
          <text x={INCOME_X} y={layout.incomeNode.y + layout.incomeNode.h + 20} className="tnum" fill="var(--muted)" fontSize="13">
            {rupee(earned)}
          </text>

          {/* bucket nodes */}
          {layout.bucketNodes.map((bn) => {
            const dim = selected != null && selected !== bn.b.key;
            const cy = bn.y + bn.h / 2;
            return (
              <g
                key={bn.b.key}
                onClick={() => onSelect(selected === bn.b.key ? null : bn.b.key)}
                style={{ cursor: "pointer", opacity: dim ? 0.3 : 1, transition: "opacity .35s" }}
              >
                <rect x={BUCKET_X} y={bn.y} width={NODE} height={bn.h} rx={3} fill={bn.b.color} />
                <text x={BUCKET_X + NODE + 9} y={cy - 2} fill="var(--ink)" fontSize="14">
                  {bn.b.name.replace(/ \(.*/, "")}
                </text>
                <text x={BUCKET_X + NODE + 9} y={cy + 13} className="tnum" fill="var(--muted)" fontSize="12">
                  {rupee(bn.b.allocated)}
                </text>
              </g>
            );
          })}

          {/* pot nodes */}
          {[...layout.potNodes.values()].map((pn, i) => {
            const cy = pn.y + pn.h / 2;
            return (
              <g key={`pot-${i}`}>
                <rect x={POT_X} y={pn.y} width={NODE} height={pn.h} rx={3} fill={pn.color} />
                <text x={POT_X - 9} y={cy - 2} textAnchor="end" fill="var(--ink)" fontSize="13">
                  {pn.name}
                </text>
                <text x={POT_X - 9} y={cy + 13} textAnchor="end" className="tnum" fill="var(--muted)" fontSize="12">
                  {rupee(pn.amount)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
}
