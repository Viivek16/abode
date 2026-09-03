"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/brand/Logo";
import ProfileButton from "@/components/profile/ProfileButton";

const TABS = [
  { href: "/", label: "Dashboard" },
  { href: "/notepad", label: "Notepad" },
] as const;

// Minimal top bar: wordmark left, the two primary tabs centred as a segmented
// control with a sliding highlight, profile avatar right. Two modes:
//   • controlled (onTab given) — used inside the swipeable shell; tabs toggle
//     state instead of navigating, so switching is instant with no route change.
//   • link — used on standalone routes like /profile; tabs are real links.
export default function TopNav({ tab, onTab }: { tab?: number; onTab?: (i: number) => void }) {
  const path = usePathname();
  const controlled = onTab != null;
  const activeIndex = controlled
    ? tab ?? 0
    : path === "/"
      ? 0
      : path.startsWith("/notepad")
        ? 1
        : -1;

  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <Link href="/" aria-label="Abode — dashboard" className="tap shrink-0">
        <Logo size={30} />
      </Link>

      <nav className="relative grid w-[188px] grid-cols-2 rounded-pill bg-surface p-1 ring-1 ring-edge">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-pill bg-accent/15 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`, opacity: activeIndex < 0 ? 0 : 1 }}
        />
        {TABS.map((t, i) => {
          const on = activeIndex === i;
          const cls = `relative z-10 rounded-pill py-1.5 text-center text-xs font-medium transition-colors ${
            on ? "text-accent" : "text-muted hover:text-ink"
          }`;
          return controlled ? (
            <button
              key={t.href}
              type="button"
              aria-current={on ? "page" : undefined}
              onClick={() => onTab!(i)}
              className={cls}
            >
              {t.label}
            </button>
          ) : (
            <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className={cls}>
              {t.label}
            </Link>
          );
        })}
      </nav>

      <ProfileButton />
    </header>
  );
}
