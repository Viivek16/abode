"use client";

import { useEffect, useState } from "react";

// Reveal-on-scroll-up. Returns true while the user scrolls DOWN (past a small
// offset) so a sticky header can slide out of the way, and false when they
// scroll up or sit near the top so it slides back in. rAF-throttled; reads the
// window scroll (the app's vertical scroller).
export function useHideOnScroll(threshold = 6, revealAt = 64) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const dy = y - last;
      if (Math.abs(dy) > threshold) {
        setHidden(dy > 0 && y > revealAt);
        last = y;
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, revealAt]);

  return hidden;
}
