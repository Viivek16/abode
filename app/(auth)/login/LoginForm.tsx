"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initial: LoginState = {};

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="email" className="eyebrow">
        Owner email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="h-12 rounded-[10px] bg-surface-2 px-4 text-ink placeholder:text-faint outline-none ring-1 ring-edge focus:ring-accent"
      />
      <label htmlFor="password" className="eyebrow">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="••••••••"
        className="h-12 rounded-[10px] bg-surface-2 px-4 text-ink placeholder:text-faint outline-none ring-1 ring-edge focus:ring-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="tap mt-1 h-12 rounded-[10px] bg-accent px-4 text-base font-semibold text-[#14100E] shadow-[0_8px_24px_-10px_rgba(216,172,85,0.7)] transition-all hover:brightness-105 disabled:opacity-60 disabled:shadow-none"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {(state.error || notice) && (
        <p className="text-sm text-negative" role="alert">
          {state.error ??
            (notice === "not_allowed"
              ? "That address is not allowed."
              : "Session expired. Sign in again.")}
        </p>
      )}
    </form>
  );
}
