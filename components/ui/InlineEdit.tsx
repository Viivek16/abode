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

// Tap a value to edit it in place. Read state = a faint dotted underline that
// quietly says "tappable". Edit state is a soft honey-tinted field — no hard
// border box (that read as gimmicky), just a breathable wash with an accent
// caret — sized to its content so it never spills over neighbours. Commit on
// blur/Enter, cancel on Esc.
const READ =
  "cursor-text -mx-0.5 rounded-[6px] px-1 text-left underline decoration-dotted decoration-1 decoration-[color:var(--faint)] underline-offset-[5px] transition-colors hover:bg-white/[0.04] hover:text-ink hover:decoration-accent";
const EDIT =
  "min-w-0 max-w-full rounded-[7px] bg-accent/10 px-1.5 text-ink caret-accent outline-none transition-colors focus:outline-none focus-visible:outline-none";

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
