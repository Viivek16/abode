import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// One shared browser client for the whole tab (avoids multiple GoTrue instances).
let _client: ReturnType<typeof createClient> | undefined;
export function supabaseBrowser() {
  return (_client ??= createClient());
}
