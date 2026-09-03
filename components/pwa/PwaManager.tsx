"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const DISMISS_INSTALL = "abode:install-dismissed";
const DISMISS_REMIND = "abode:remind-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const readFlag = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const writeFlag = (k: string) => {
  try {
    localStorage.setItem(k, "1");
  } catch {
    /* private mode — ignore */
  }
};

// Handles the three PWA touchpoints: register the service worker, offer a
// premium install prompt on mobile (Android via the native event, iOS via a
// short how-to), and let signed-in users switch on the monthly reminders.
export default function PwaManager() {
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [showRemind, setShowRemind] = useState(false);
  const [firstName, setFirstName] = useState("there");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  // Install prompt (skip if already installed or previously dismissed).
  useEffect(() => {
    if (isStandalone() || readFlag(DISMISS_INSTALL)) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // iOS never fires the event; this one-time client check runs post-hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isIos()) setIosHint(true);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  // Reminders opt-in — only for a signed-in user who hasn't decided yet.
  useEffect(() => {
    if (!("Notification" in window) || !("PushManager" in window) || !VAPID_PUBLIC) return;
    if (Notification.permission !== "default" || readFlag(DISMISS_REMIND)) return;
    if (isIos() && !isStandalone()) return; // iOS push needs the installed app
    let alive = true;
    (async () => {
      const { data } = await supabaseBrowser().auth.getUser();
      if (!alive || !data.user) return;
      const meta = (data.user.user_metadata ?? {}) as Record<string, string>;
      const full = meta.full_name || meta.name || data.user.email?.split("@")[0] || "there";
      setFirstName(full.split(/\s+/)[0]);
      setShowRemind(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const install = async () => {
    setShowInstall(false);
    if (!installEvt) return;
    await installEvt.prompt();
    installEvt.userChoice.catch(() => {});
    setInstallEvt(null);
    writeFlag(DISMISS_INSTALL);
  };

  const dismissInstall = () => {
    setShowInstall(false);
    setIosHint(false);
    writeFlag(DISMISS_INSTALL);
  };

  const enableReminders = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub, firstName }),
        });
      }
    } catch {
      /* denied or unsupported — fall through and close */
    } finally {
      writeFlag(DISMISS_REMIND);
      setShowRemind(false);
      setBusy(false);
    }
  };

  const dismissRemind = () => {
    setShowRemind(false);
    writeFlag(DISMISS_REMIND);
  };

  const mode: "install" | "ios" | "remind" | null = showInstall
    ? "install"
    : iosHint
      ? "ios"
      : showRemind
        ? "remind"
        : null;
  if (!mode) return null;

  const copy = {
    install: { icon: iconDown, title: "Install Abode", desc: "Add it to your home screen for one-tap access, offline-ready." },
    ios: { icon: iconShare, title: "Install Abode", desc: "Tap the Share icon, then “Add to Home Screen.”" },
    remind: { icon: iconBell, title: "Stay on track", desc: "A gentle nudge on the 1st, 10th, 20th and month-end to keep your budget honest." },
  }[mode];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
      <div className="reveal glass glass-2 mx-auto flex max-w-md items-center gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent/15 text-accent">
          {copy.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{copy.title}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{copy.desc}</p>
        </div>
        {mode === "install" && (
          <button
            type="button"
            onClick={install}
            className="tap shrink-0 rounded-pill bg-accent px-4 py-2 text-xs font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(205,163,73,0.7)]"
          >
            Install
          </button>
        )}
        {mode === "remind" && (
          <button
            type="button"
            onClick={enableReminders}
            disabled={busy}
            className="tap shrink-0 rounded-pill bg-accent px-4 py-2 text-xs font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(205,163,73,0.7)] disabled:opacity-60"
          >
            {busy ? "Enabling…" : "Enable"}
          </button>
        )}
        <button
          type="button"
          onClick={mode === "remind" ? dismissRemind : dismissInstall}
          aria-label="Dismiss"
          className="tap -mr-1 grid size-7 shrink-0 place-items-center rounded-pill text-faint transition-colors hover:text-ink"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const iconDown = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const iconShare = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 15V4m0 0L8 8m4-4l4 4M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const iconBell = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
