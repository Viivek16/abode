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

// Tap a value to edit it in place; commit on blur or Enter, cancel on Escape.
// The read state reads as plain text but carries a dotted underline so it is
// clearly tappable (works on touch too, where there is no hover).
const READ =
  "-mx-1 cursor-text rounded-[6px] border-b border-dashed border-edge-strong px-1 pb-0.5 pt-0.5 text-left transition-colors hover:border-accent hover:bg-surface-2";

export function InlineText({
  value,
  onCommit,
  placeholder = "…",
  className = "",
  inputClassName = "",
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
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
        className={`rounded-[6px] bg-surface-2 px-1.5 py-0.5 text-ink outline-none ring-1 ring-accent ${inputClassName}`}
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
      className={`${READ} ${value ? "" : "text-faint"} ${className}`}
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

  if (editing) {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-[6px] bg-surface-2 px-1.5 py-0.5 ring-1 ring-accent ${className}`}>
        <span className="text-xs text-faint">₹</span>
        <input
          ref={ref}
          inputMode="numeric"
          value={val ? Number(val.replace(/\D/g, "")).toLocaleString("en-IN") : ""}
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
          className="tnum w-24 bg-transparent text-right text-ink outline-none placeholder:text-faint"
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
      className={`tnum ${READ} ${className}`}
    >
      {rupee(value)}
    </button>
  );
}
