import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./types";

/**
 * Client Supabase cote navigateur (composants client).
 * Utilise la cle publishable (anon) — JAMAIS le service role.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
