"use client";

import { ymLabel } from "@/lib/logic";

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MonthSwitcher({
  ym,
  onShift,
}: {
  ym: string;
  onShift: (delta: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-pill bg-surface p-1 ring-1 ring-edge">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onShift(-1)}
        className="grid size-8 place-items-center rounded-pill text-muted hover:bg-surface-2 hover:text-ink"
      >
        <Arrow dir="left" />
      </button>
      <span className="min-w-28 text-center text-sm font-medium text-ink sm:min-w-32">
        {ymLabel(ym)}
      </span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onShift(1)}
        className="grid size-8 place-items-center rounded-pill text-muted hover:bg-surface-2 hover:text-ink"
      >
        <Arrow dir="right" />
      </button>
    </div>
  );
}
