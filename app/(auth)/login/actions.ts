"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; notice?: string };

// Public email/password auth. `mode` (hidden field) picks sign-in vs sign-up;
// anyone can create an account — each gets their own RLS-isolated dashboard.
export async function authenticate(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const mode = String(formData.get("mode") ?? "signin");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();

  if (mode === "signup") {
    if (password.length < 6)
      return { error: "Password must be at least 6 characters." };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // Email confirmation on → no session yet; point them at their inbox.
    if (!data.session)
      return { notice: "Check your email to confirm your account, then sign in." };
    redirect("/");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/");
}
