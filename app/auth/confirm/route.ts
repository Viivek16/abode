import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles both magic-link delivery styles:
//  - token_hash + type (recommended template) -> verifyOtp
//  - code (default PKCE template)             -> exchangeCodeForSession
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const admin = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

  const supabase = await createClient();

  let ok = false;
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) {
    // Owner-only gate at the callback (Section 9): reject any other address.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = (user?.email ?? "").toLowerCase();
    if (email && email === admin) {
      return NextResponse.redirect(`${origin}/`);
    }
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_allowed`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
