"use client";

import { useActionState, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { authenticate, type LoginState } from "./actions";

const initial: LoginState = {};

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(authenticate, initial);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [redirecting, setRedirecting] = useState(false);
  const signup = mode === "signup";

  async function google() {
    setRedirecting(true);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setRedirecting(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={google}
        disabled={redirecting}
        className="tap flex h-12 items-center justify-center gap-2.5 rounded-[10px] bg-ink text-sm font-semibold text-[#14100E] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] transition-all hover:brightness-95 disabled:opacity-60"
      >
        <GoogleG />
        {redirecting ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="my-1 flex items-center gap-3">
        <span className="h-px flex-1 bg-edge" />
        <span className="text-[11px] text-faint">or with email</span>
        <span className="h-px flex-1 bg-edge" />
      </div>

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="mode" value={mode} />
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-label="Email"
          placeholder="you@example.com"
          className="h-12 rounded-[10px] bg-surface-2 px-4 text-ink placeholder:text-faint outline-none ring-1 ring-edge focus:ring-accent"
        />
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={signup ? "new-password" : "current-password"}
          aria-label="Password"
          placeholder={signup ? "Create a password" : "Password"}
          className="h-12 rounded-[10px] bg-surface-2 px-4 text-ink placeholder:text-faint outline-none ring-1 ring-edge focus:ring-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="tap h-12 rounded-[10px] bg-accent px-4 text-sm font-semibold text-[#14100E] shadow-[0_8px_24px_-12px_rgba(216,172,85,0.6)] transition-all hover:brightness-105 disabled:opacity-60"
        >
          {pending
            ? signup
              ? "Creating account…"
              : "Signing in…"
            : signup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(signup ? "signin" : "signup")}
        className="mt-0.5 text-center text-xs text-muted transition-colors hover:text-ink"
      >
        {signup ? (
          <>Already have an account? <span className="text-accent">Sign in</span></>
        ) : (
          <>New here? <span className="text-accent">Create an account</span></>
        )}
      </button>

      {state.notice && (
        <p className="text-sm text-positive" role="status">
          {state.notice}
        </p>
      )}
      {(state.error || notice) && (
        <p className="text-sm text-negative" role="alert">
          {state.error ??
            (notice === "auth"
              ? "Sign-in failed. Try again."
              : "Session expired. Sign in again.")}
        </p>
      )}
    </div>
  );
}
