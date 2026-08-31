import { createClient } from "@supabase/supabase-js";

// Service-role client for server-to-server writes (e.g. the Sheet -> app pull,
// authenticated by a shared secret, not a user session). SERVER ONLY.
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
