"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import TopNav from "@/components/nav/TopNav";
import MonthSwitcher from "@/components/month-switcher/MonthSwitcher";
import Dashboard from "@/components/Dashboard";
import NotepadView from "@/components/notepad/NotepadView";
import { useIncomeMonths } from "@/lib/hooks/useDashboard";
import { currentYm, shiftYm } from "@/lib/logic";

// Dashboard + Notepad live in one horizontally-swipeable surface. The pill and a
// left/right swipe both move between the two panes via native scroll-snap.
//
// Each pane scrolls VERTICALLY on its own (not the window), so a short pane ends
// exactly where its content does — no phantom blank inherited from the taller
// pane. The nav + month pills share one overlay header that slides away on
// scroll-down and drops back in on scroll-up; each pane reserves the header's
// measured height as top padding, so there are no magic offsets. Month selection
// lives here so the switcher can ride in that shared header.
const HIDE_SCROLL =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

// Measure before paint on the client (no flash of content under the header),
// plain effect on the server (avoids the useLayoutEffect SSR warning).
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function AppShell({ initial }: { initial: "dashboard" | "notepad" }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);

  const [tab, setTab] = useState(initial === "notepad" ? 1 : 0);
  const [hidden, setHidden] = useState(false);
  const [headH, setHeadH] = useState(0);

  const [picked, setPicked] = useState<string | null>(null);
  const { data: incomeMonths } = useIncomeMonths();
  const ym = picked ?? incomeMonths?.[incomeMonths.length - 1] ?? currentYm();

  // Land on the requested pane immediately on mount (no animation).
  useEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollLeft = (initial === "notepad" ? 1 : 0) * el.clientWidth;
  }, [initial]);

  // Track the header's real height (it grows/shrinks with the month row) so each
  // pane reserves exactly that much top padding.
  useIsoLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeadH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab]);

  const go = (i: number) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Horizontal settle → reflect the pane in tab + URL and re-sync the reveal to
  // the pane we landed on.
  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== tab) {
      setTab(i);
      window.history.replaceState(null, "", i === 1 ? "/notepad" : "/");
      lastY.current = (i === 1 ? noteRef.current : dashRef.current)?.scrollTop ?? 0;
      setHidden(false);
    }
  };

  // Vertical scroll on the active pane → hide the header on the way down, reveal
  // it on the way up (or near the top).
  const onPaneScroll = (el: HTMLDivElement) => {
    const y = el.scrollTop;
    const dy = y - lastY.current;
    if (Math.abs(dy) > 6) {
      setHidden(dy > 0 && y > 64);
      lastY.current = y;
    }
  };

  const paneClass = `h-full w-full shrink-0 snap-start overflow-y-auto overscroll-y-contain ${HIDE_SCROLL}`;
  const paneStyle = { paddingTop: headH || undefined };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <header
        ref={headerRef}
        className={`absolute inset-x-0 top-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
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
        onScroll={onTrackScroll}
        className={`flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain ${HIDE_SCROLL}`}
      >
        <div ref={dashRef} onScroll={(e) => onPaneScroll(e.currentTarget)} style={paneStyle} className={paneClass}>
          <Dashboard active={tab === 0} ym={ym} onPickMonth={setPicked} />
        </div>
        <div ref={noteRef} onScroll={(e) => onPaneScroll(e.currentTarget)} style={paneStyle} className={paneClass}>
          <NotepadView active={tab === 1} />
        </div>
      </div>
    </div>
  );
}
