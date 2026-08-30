"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initial: LoginState = {};

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(sendMagicLink, initial);

  if (state.sent) {
    return (
      <div className="text-center">
        <p className="font-display text-2xl text-ink">Check your email</p>
        <p className="mt-2 text-sm text-muted">
          A sign-in link is on its way. Open it on this device to continue.
        </p>
      </div>
    );
  }

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
        className="h-12 rounded-button bg-surface-2 px-4 text-ink placeholder:text-faint outline-none ring-1 ring-edge focus:ring-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="font-display h-12 rounded-button bg-accent px-4 text-base font-semibold text-[#14100E] transition-opacity disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send magic link"}
      </button>

      {(state.error || notice) && (
        <p className="text-sm text-negative" role="alert">
          {state.error ??
            (notice === "not_allowed"
              ? "That address is not allowed."
              : "Sign-in link was invalid or expired. Try again.")}
        </p>
      )}
    </form>
  );
}
