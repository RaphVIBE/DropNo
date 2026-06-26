import type { NextRequest } from "next/server";

/**
 * Anti-abus best-effort pour les endpoints publics non authentifiés
 * (contact, alertes, waitlist).
 *
 * ⚠️ Le rate-limit est en mémoire process : efficace contre les rafales d'une
 * même instance, mais une plateforme serverless multi-instances le contourne.
 * Le honeypot reste la défense principale ; migrer vers un store partagé
 * (Upstash/Redis) si du spam distribué apparaît.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 heure
const buckets = new Map<string, Map<string, number[]>>();

/** IP best-effort derrière le proxy Netlify. */
export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-nf-client-connection-ip") ||
    "anonymous"
  );
}

/**
 * Retourne true si l'IP a dépassé `max` requêtes sur la dernière heure pour ce
 * `bucket` (namespace par endpoint). Incrémente le compteur quand sous la limite.
 */
export function rateLimited(bucket: string, ip: string, max: number): boolean {
  let hits = buckets.get(bucket);
  if (!hits) {
    hits = new Map<string, number[]>();
    buckets.set(bucket, hits);
  }
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

/**
 * Honeypot : un bot remplit tous les champs, y compris le champ leurre `website`
 * (masqué en CSS côté formulaire). Rempli -> on considère la requête comme un bot.
 */
export function isHoneypotFilled(body: Record<string, unknown>): boolean {
  return typeof body.website === "string" && body.website.trim().length > 0;
}
