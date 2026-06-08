import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Helpers alertes "montre" (visiteur sans compte, double opt-in).
 *
 * La table drop_alerts est en deny-all et hors des types générés : on l'accède
 * via un client service en accès non typé, localisé ici.
 */

export function alertsClient(): SupabaseClient {
  return createServiceClient() as unknown as SupabaseClient;
}

/** Jeton opaque servant à la fois de confirmation et de désinscription. */
export function newAlertToken(): string {
  return randomBytes(24).toString("base64url");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(s: unknown): s is string {
  return typeof s === "string" && s.length <= 254 && EMAIL_RE.test(s);
}

/** URL publique du site (liens de confirmation / désinscription). */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://dropno.eu";
  return raw.replace(/\/$/, "");
}
