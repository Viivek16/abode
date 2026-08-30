import Link from "next/link";

export default function UpcomingStrip() {
  const items = ["Fund managers", "Big buys", "Studio setup", "Lending"];
  return (
    <Link
      href="/upcoming"
      className="block rounded-card bg-surface p-5 ring-1 ring-edge transition-colors hover:bg-surface-2"
    >
      <div className="flex items-center justify-between">
        <p className="eyebrow">Upcoming</p>
        <span className="text-xs text-accent">View →</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i}
            className="rounded-pill bg-surface-2 px-3 py-1 text-xs text-muted"
          >
            {i}
          </span>
        ))}
      </div>
    </Link>
  );
}
