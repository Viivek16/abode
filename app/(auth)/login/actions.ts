"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const admin = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

  if (!email || !password) return { error: "Enter your email and password." };
  // Owner-only.
  if (email !== admin) return { error: "This address is not allowed." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };
  if ((data.user?.email ?? "").toLowerCase() !== admin) {
    await supabase.auth.signOut();
    return { error: "This address is not allowed." };
  }

  redirect("/");
}
