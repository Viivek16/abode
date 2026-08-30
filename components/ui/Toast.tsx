"use client";

import { useEffect } from "react";

export default function Toast({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 2200);
    return () => clearTimeout(id);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="rounded-pill bg-surface-2 px-4 py-2 text-sm text-ink ring-1 ring-edge shadow-lg">
        {message}
      </div>
    </div>
  );
}
