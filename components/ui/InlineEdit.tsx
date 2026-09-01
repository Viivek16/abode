"use client";

import { useEffect, useRef, useState } from "react";
import { rupee } from "@/lib/format";

// Always visible so "remove this row" is never a hidden hover-only action.
export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Remove"
      onClick={onClick}
      className="tap grid size-8 shrink-0 place-items-center rounded-[8px] text-faint opacity-60 transition-all hover:bg-surface-2 hover:text-negative hover:opacity-100"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// Tap a value to edit it in place. Read state = plain text with a dotted
// underline (clearly tappable, works on touch). Edit state is minimal: no filled
// box, just an accent underline, and the input is sized to its content so it can
// never spill over neighbouring elements. Commit on blur/Enter, cancel on Esc.
const READ =
  "cursor-text rounded-[4px] border-b border-dashed border-edge-strong px-0.5 text-left transition-colors hover:border-accent hover:text-accent-soft";
const EDIT =
  "min-w-0 max-w-full border-b-2 border-accent bg-transparent px-0.5 text-ink outline-none";

const ch = (s: string, min: number) => `${Math.min(Math.max(s.length, min) + 1, 22)}ch`;

export function InlineText({
  value,
  onCommit,
  placeholder = "…",
  className = "",
  grow = false,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  className?: string;
  grow?: boolean; // fill the flex cell instead of sizing to content
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  function commit() {
    setEditing(false);
    if (val.trim() !== value) onCommit(val.trim());
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setVal(value);
            setEditing(false);
          }
        }}
        style={grow ? undefined : { width: ch(val || placeholder, 4) }}
        className={`${EDIT} ${grow ? "w-full" : ""} ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setVal(value);
        setEditing(true);
      }}
      className={`${READ} ${grow ? "block w-full truncate" : ""} ${value ? "" : "text-faint"} ${className}`}
    >
      {value || placeholder}
    </button>
  );
}

export function InlineAmount({
  value,
  onCommit,
  className = "",
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value || ""));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  function commit() {
    setEditing(false);
    const n = parseInt(val.replace(/\D/g, ""), 10) || 0;
    if (n !== value) onCommit(n);
  }

  const grouped = val ? Number(val.replace(/\D/g, "")).toLocaleString("en-IN") : "";

  if (editing) {
    return (
      <span className={`inline-flex items-baseline gap-0.5 whitespace-nowrap ${className}`}>
        <span className="text-xs text-faint">₹</span>
        <input
          ref={ref}
          inputMode="numeric"
          value={grouped}
          onChange={(e) => setVal(e.target.value.replace(/\D/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setVal(String(value || ""));
              setEditing(false);
            }
          }}
          placeholder="0"
          style={{ width: ch(grouped || "0", 3) }}
          className={`${EDIT} tnum text-right`}
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setVal(String(value || ""));
        setEditing(true);
      }}
      className={`tnum whitespace-nowrap ${READ} ${className}`}
    >
      {rupee(value)}
    </button>
  );
}
