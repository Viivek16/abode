import Link from "next/link";

export default function NotepadStrip() {
  const items = ["Fund managers", "Big buys", "Studio setup", "Lending"];
  return (
    <Link href="/notepad" className="glass lift tap block p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Notepad</p>
        <span className="text-xs text-accent">Open →</span>
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
