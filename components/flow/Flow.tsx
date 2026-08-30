"use client";

import { useMemo } from "react";
import { compact } from "@/lib/format";
import type { BucketKey, BucketView, Pot, Transfer } from "@/lib/types";

const W = 640;
const H = 340;
const TOP = 24;
const AVAIL = H - TOP * 2;
const NODE = 13;
const GAP = 10;
const INCOME_X = 10;
const BUCKET_X = W / 2 - NODE / 2;
const POT_X = W - NODE - 10;

type Link = {
  d: string;
  width: number;
  color: string;
  bucket: BucketKey;
};

function path(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

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
  const layout = useMemo(() => {
    const totalAlloc = buckets.reduce((s, b) => s + b.allocated, 0);
    if (totalAlloc <= 0) return null;

    const bucketAvail = AVAIL - (buckets.length - 1) * GAP;
    const k = bucketAvail / totalAlloc;
    const potById = new Map(pots.map((p) => [p.id, p]));

    // Income node (single block), and per-bucket source slices along its right edge.
    const incomeY = TOP + (AVAIL - bucketAvail) / 2;
    const incomeNode = { x: INCOME_X, y: incomeY, h: bucketAvail };

    // Bucket nodes stacked with gaps.
    const bucketNodes: {
      b: BucketView;
      y: number;
      h: number;
      srcY: number; // center of its slice on the income node
    }[] = [];
    let cyBucket = TOP;
    let cyIncome = incomeY;
    for (const b of buckets) {
      const h = b.allocated * k;
      bucketNodes.push({ b, y: cyBucket, h, srcY: cyIncome + h / 2 });
      cyBucket += h + GAP;
      cyIncome += h;
    }

    // income -> bucket links
    const inLinks: Link[] = bucketNodes.map((bn) => ({
      d: path(INCOME_X + NODE, bn.srcY, BUCKET_X, bn.y + bn.h / 2),
      width: Math.max(bn.h, 1),
      color: bn.b.color,
      bucket: bn.b.key,
    }));

    // Aggregate transfers per pot, ordered by the bucket that first funds them.
    const valid = transfers.filter((t) => t.pot_id && Number(t.amount) > 0);
    const order = new Map(buckets.map((b, i) => [b.key, i]));
    const potAgg = new Map<string, { received: number; rank: number }>();
    for (const t of valid) {
      const a = potAgg.get(t.pot_id!) ?? {
        received: 0,
        rank: order.get(t.quota_key as BucketKey) ?? 99,
      };
      a.received += Number(t.amount);
      potAgg.set(t.pot_id!, a);
    }
    const potIds = [...potAgg.keys()].sort(
      (a, b) => potAgg.get(a)!.rank - potAgg.get(b)!.rank,
    );

    const totalReceived = [...potAgg.values()].reduce((s, p) => s + p.received, 0);
    const potsHeight =
      totalReceived * k + Math.max(potIds.length - 1, 0) * GAP;
    let cyPot = Math.max(TOP, TOP + (AVAIL - potsHeight) / 2);
    const potNodes = new Map<
      string,
      { y: number; h: number; cum: number; name: string; color: string }
    >();
    for (const id of potIds) {
      const h = potAgg.get(id)!.received * k;
      const p = potById.get(id);
      potNodes.set(id, {
        y: cyPot,
        h,
        cum: cyPot,
        name: p?.name ?? "Pot",
        color: p?.color ?? "var(--muted)",
      });
      cyPot += h + GAP;
    }

    // bucket -> pot links, partitioning each bucket's right edge and each pot's left edge.
    const bucketCum = new Map<BucketKey, number>();
    for (const bn of bucketNodes) bucketCum.set(bn.b.key, bn.y);
    const outLinks: Link[] = [];
    const ordered = [...valid].sort(
      (a, b) =>
        (order.get(a.quota_key as BucketKey) ?? 99) -
        (order.get(b.quota_key as BucketKey) ?? 99),
    );
    for (const t of ordered) {
      const bk = t.quota_key as BucketKey;
      const w = Number(t.amount) * k;
      const sy = bucketCum.get(bk) ?? TOP;
      const pn = potNodes.get(t.pot_id!);
      if (!pn) continue;
      const py = pn.cum;
      const color = buckets.find((b) => b.key === bk)?.color ?? "var(--muted)";
      outLinks.push({
        d: path(BUCKET_X + NODE, sy + w / 2, POT_X, py + w / 2),
        width: Math.max(w, 1),
        color,
        bucket: bk,
      });
      bucketCum.set(bk, sy + w);
      pn.cum = py + w;
    }

    return { incomeNode, bucketNodes, inLinks, outLinks, potNodes };
  }, [earned, buckets, transfers, pots]);

  return (
    <section className="rounded-card bg-surface p-6 ring-1 ring-edge">
      <p className="eyebrow mb-4">The flow</p>

      {!layout ? (
        <p className="py-10 text-center text-sm text-faint">
          Add income for this month to see the waterfall.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ minWidth: 480 }}
            role="img"
            aria-label="Money flow from income into quota buckets and pots"
          >
            {/* links: income -> buckets */}
            {layout.inLinks.map((l, i) => {
              const dim = selected != null && selected !== l.bucket;
              return (
                <path
                  key={`in-${i}`}
                  d={l.d}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={l.width}
                  className="flow-link"
                  style={{ opacity: dim ? 0.08 : 0.4, transition: "opacity .3s" }}
                />
              );
            })}
            {/* links: buckets -> pots */}
            {layout.outLinks.map((l, i) => {
              const dim = selected != null && selected !== l.bucket;
              return (
                <path
                  key={`out-${i}`}
                  d={l.d}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={l.width}
                  className="flow-link"
                  style={{ opacity: dim ? 0.08 : 0.45, transition: "opacity .3s" }}
                />
              );
            })}

            {/* income node */}
            <rect
              x={layout.incomeNode.x}
              y={layout.incomeNode.y}
              width={NODE}
              height={layout.incomeNode.h}
              rx={4}
              fill="var(--accent)"
            />
            <text x={INCOME_X} y={layout.incomeNode.y - 8} className="tnum" fill="var(--muted)" fontSize="11">
              In {compact(earned)}
            </text>

            {/* bucket nodes */}
            {layout.bucketNodes.map((bn) => {
              const dim = selected != null && selected !== bn.b.key;
              return (
                <g
                  key={bn.b.key}
                  onClick={() => onSelect(selected === bn.b.key ? null : bn.b.key)}
                  style={{ cursor: "pointer", opacity: dim ? 0.35 : 1, transition: "opacity .3s" }}
                >
                  <rect x={BUCKET_X} y={bn.y} width={NODE} height={bn.h} rx={4} fill={bn.b.color} />
                  <text
                    x={BUCKET_X + NODE + 6}
                    y={bn.y + bn.h / 2 + 3}
                    fill="var(--ink)"
                    fontSize="10"
                  >
                    {bn.b.name.replace(/ \(.*/, "")}
                  </text>
                </g>
              );
            })}

            {/* pot nodes */}
            {[...layout.potNodes.values()].map((pn, i) => (
              <g key={`pot-${i}`}>
                <rect x={POT_X} y={pn.y} width={NODE} height={pn.h} rx={4} fill={pn.color} />
                <text
                  x={POT_X - 6}
                  y={pn.y + pn.h / 2 + 3}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize="10"
                >
                  {pn.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </section>
  );
}
