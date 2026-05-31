import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Client Supabase SERVICE ROLE — contourne la RLS.
 *
 * ⚠️ Reserve au code serveur de confiance uniquement : cron de fermeture
 * de drops, webhooks, back-office admin. Ne JAMAIS importer cote client
 * ni dans un Server Component rendu pour un utilisateur.
 *
 * Cf. db/schema-design.md principe 4 : pas de service role en runtime user.
 */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
