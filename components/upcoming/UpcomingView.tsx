"use client";

import Link from "next/link";
import { useState } from "react";
import { rupee, compact } from "@/lib/format";
import { useUpcoming, type LineItem } from "@/lib/hooks/useUpcoming";

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
      <div className="mb-3 flex items-baseline justify-between">
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

function ItemList({ items }: { items: LineItem[] }) {
  return (
    <ul className="divide-y divide-[var(--edge)]">
      {items.map((it, i) => (
        <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
          <span className="text-ink">{it.name}</span>
          <span className="flex items-center gap-3">
            {it.date && <span className="text-faint">{it.date}</span>}
            <span className="tnum text-muted">{rupee(it.amount)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function UpcomingView() {
  const { data, isLoading } = useUpcoming();
  const [showStudio, setShowStudio] = useState(false);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-5">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="font-display text-lg font-bold text-ink">Abode</p>
          <Link href="/" className="text-xs text-muted hover:text-ink">
            Dashboard
          </Link>
          <span className="text-xs font-medium text-accent">Upcoming</span>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-pill px-3 py-2 text-xs text-muted ring-1 ring-edge hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </header>

      <h1 className="font-display mb-1 text-2xl font-bold text-ink">Upcoming</h1>
      <p className="mb-5 text-sm text-muted">
        Fund managers, big buys, studio setup, and lending — from your Balance Sheet.
      </p>

      {isLoading || !data ? (
        <p className="text-sm text-faint">Loading…</p>
      ) : (
        <div className="space-y-4">
          {/* Fund managers */}
          <Section title="Fund managers">
            <div className="grid gap-3 sm:grid-cols-2">
              {data.fund_managers.map((fm, i) => (
                <div key={i} className="rounded-button bg-surface-2 p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-medium text-ink">{fm.name}</p>
                    <span className="tnum text-sm text-accent">{rupee(fm.amount)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {fm.type} · {fm.platform} · {fm.split}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-faint">
                    <span>Invested {fm.date}</span>
                    <span>Matures {fm.maturity}</span>
                    <span>Returns {fm.returns}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Big buys */}
          <Section title="Big buys" total={data.big_buys.total}>
            <ItemList items={data.big_buys.items} />
          </Section>

          {/* Studio setup */}
          <Section title="Studio setup" total={data.studio.total}>
            <p className="mb-2 text-xs text-faint">
              {data.studio.items.length} items
            </p>
            {showStudio ? (
              <ItemList items={data.studio.items} />
            ) : (
              <ItemList items={data.studio.items.slice(0, 5)} />
            )}
            {data.studio.items.length > 5 && (
              <button
                type="button"
                onClick={() => setShowStudio((s) => !s)}
                className="mt-3 text-xs text-accent hover:text-accent-soft"
              >
                {showStudio ? "Show less" : `Show all ${data.studio.items.length}`}
              </button>
            )}
          </Section>

          {/* Lending */}
          <Section title="Lending" total={data.lending.total}>
            {data.lending.items.length ? (
              <ItemList items={data.lending.items} />
            ) : (
              <p className="text-sm text-faint">Nothing outstanding.</p>
            )}
          </Section>
        </div>
      )}
    </main>
  );
}
