"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileButton from "@/components/profile/ProfileButton";

const TABS = [
  { href: "/", label: "Dashboard" },
  { href: "/notepad", label: "Notepad" },
] as const;

// Minimal top bar shared across screens: wordmark left, the two primary tabs
// centred as a segmented control, profile avatar right. The month lives on its
// own row on the dashboard, so this stays uncluttered on a phone.
export default function TopNav() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <Link
        href="/"
        className="font-display shrink-0 text-lg font-semibold tracking-tight text-ink"
      >
        Abode
      </Link>

      <nav className="flex items-center gap-1 rounded-pill bg-surface p-1 ring-1 ring-edge">
        {TABS.map((t) => {
          const on = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={`tap rounded-pill px-3.5 py-1.5 text-xs font-medium transition-colors ${
                on ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <ProfileButton />
    </header>
  );
}
