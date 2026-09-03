"use client";

import { useEffect, useRef, useState } from "react";
import TopNav from "@/components/nav/TopNav";
import Dashboard from "@/components/Dashboard";
import NotepadView from "@/components/notepad/NotepadView";

// Dashboard + Notepad live in one horizontally-swipeable surface. The pill and a
// left/right swipe both move between the two panes via native scroll-snap — GPU,
// interruptible, no route change, no glitch. The URL is kept in sync so deep
// links and refresh still land on the right pane.
export default function AppShell({ initial }: { initial: "dashboard" | "notepad" }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(initial === "notepad" ? 1 : 0);

  // Land on the requested pane immediately on mount (no animation).
  useEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollLeft = (initial === "notepad" ? 1 : 0) * el.clientWidth;
  }, [initial]);

  const go = (i: number) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Reflect the settled pane in the tab + URL, without a route change or remount.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== tab) {
      setTab(i);
      window.history.replaceState(null, "", i === 1 ? "/notepad" : "/");
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <TopNav tab={tab} onTab={go} />
      </div>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="w-full shrink-0 snap-start">
          <Dashboard active={tab === 0} />
        </div>
        <div className="w-full shrink-0 snap-start">
          <NotepadView active={tab === 1} />
        </div>
      </div>
    </>
  );
}
