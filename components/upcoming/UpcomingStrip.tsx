function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function UpcomingStrip() {
  const items = ["Fund managers", "Lending", "Big buys", "Studio setup"];
  return (
    <section className="rounded-card bg-surface p-5 ring-1 ring-edge">
      <div className="flex items-center gap-2 text-faint">
        <LockIcon />
        <p className="eyebrow">Upcoming — coming later</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i}
            className="rounded-pill bg-surface-2 px-3 py-1 text-xs text-faint"
          >
            {i}
          </span>
        ))}
      </div>
    </section>
  );
}
