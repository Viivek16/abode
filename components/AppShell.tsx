"use client";

import { useEffect, useRef, useState } from "react";
import TopNav from "@/components/nav/TopNav";
import MonthSwitcher from "@/components/month-switcher/MonthSwitcher";
import Dashboard from "@/components/Dashboard";
import NotepadView from "@/components/notepad/NotepadView";
import { useHideOnScroll } from "@/lib/hooks/useHideOnScroll";
import { useIncomeMonths } from "@/lib/hooks/useDashboard";
import { currentYm, shiftYm } from "@/lib/logic";

// Dashboard + Notepad live in one horizontally-swipeable surface. The pill and a
// left/right swipe both move between the two panes via native scroll-snap — GPU,
// interruptible, no route change, no glitch. The URL is kept in sync so deep
// links and refresh still land on the right pane.
//
// The nav + month pills share one sticky header that slides away on scroll-down
// and drops back in on scroll-up, so you can switch pane or month from anywhere
// without scrolling to the very top. Month selection lives here (not in
// Dashboard) so the switcher can ride in that shared header.
export default function AppShell({ initial }: { initial: "dashboard" | "notepad" }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(initial === "notepad" ? 1 : 0);

  const [picked, setPicked] = useState<string | null>(null);
  const { data: incomeMonths } = useIncomeMonths();
  const ym = picked ?? incomeMonths?.[incomeMonths.length - 1] ?? currentYm();

  const hidden = useHideOnScroll();

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
      <header
        className={`sticky top-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Dark gradient wash so content scrolling beneath the pills stays legible. */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-bg via-bg/95 to-transparent backdrop-blur-[6px]" />
        <div className="mx-auto w-full max-w-3xl px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3">
          <TopNav tab={tab} onTab={go} />
          {tab === 0 && (
            <div className="flex justify-center">
              <MonthSwitcher ym={ym} onShift={(d) => setPicked(shiftYm(ym, d))} />
            </div>
          )}
        </div>
      </header>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="w-full shrink-0 snap-start">
          <Dashboard active={tab === 0} ym={ym} onPickMonth={setPicked} />
        </div>
        <div className="w-full shrink-0 snap-start">
          <NotepadView active={tab === 1} />
        </div>
      </div>
    </>
  );
}
