import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./types";

/**
 * Client Supabase cote serveur (Server Components, Route Handlers, Server Actions).
 * Lit/ecrit la session via les cookies. Respecte la RLS via le JWT de l'utilisateur.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appele depuis un Server Component : le refresh de session
            // est gere par le middleware, on peut ignorer.
          }
        },
      },
    }
  );
}
