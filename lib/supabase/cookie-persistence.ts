/**
 * Persistance de session « Rester connecté ».
 *
 * Un cookie indicateur (non httpOnly, lisible côté client) pilote la durée de
 * vie des cookies d'auth Supabase :
 *  - **présent** (`1`)  => session courte : on retire maxAge/expires, le cookie
 *    est effacé à la fermeture du navigateur.
 *  - **absent** (défaut) => « Rester connecté » : on force une durée longue et
 *    explicite, indépendante des valeurs par défaut de la librairie.
 *
 * Le client pose/efface cet indicateur au moment du `verifyOtp` ; les setters
 * de cookies serveur (server.ts) et middleware le relisent à chaque écriture.
 */
export const SESSION_ONLY_COOKIE = "dn-session-only";

/** Durée d'un cookie d'auth persistant : 400 jours (plafond navigateur). */
const PERSISTENT_MAX_AGE = 60 * 60 * 24 * 400;

type CookieOptions = {
  maxAge?: number;
  expires?: Date | number;
  [key: string]: unknown;
};

/**
 * Ajuste la durée de vie d'un cookie d'auth selon le choix « Rester connecté ».
 * Ne touche pas aux suppressions (valeur vide) pour ne pas ressusciter un
 * cookie que Supabase efface (déconnexion, rotation).
 */
export function withPersistence(
  value: string,
  options: CookieOptions | undefined,
  sessionOnly: boolean
): CookieOptions {
  const base = options ?? {};
  if (!value) return base; // suppression : on laisse passer tel quel

  if (sessionOnly) {
    const { maxAge: _maxAge, expires: _expires, ...rest } = base;
    return rest;
  }
  return { ...base, maxAge: base.maxAge ?? PERSISTENT_MAX_AGE };
}
