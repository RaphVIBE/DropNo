/**
 * Accès aux pages démo prospect (`/demo/<slug>?key=...`).
 *
 * Chaque maison prospect a SA propre clé : si une maison forwarde son email,
 * le destinataire ne peut pas deviner les simulations des autres prospects en
 * changeant le slug. Les clés vivent dans la variable d'env `DEMO_KEYS`, un
 * objet JSON { "<slug>": "<clé>" } (à poser dans Netlify).
 *
 * Rétro-compatibilité : si `DEMO_KEYS` est absente, on retombe sur l'ancienne
 * `DEMO_KEY` unique (valable pour tous les slugs), pour ne rien casser tant que
 * la nouvelle variable n'est pas déployée.
 */

let cache: Record<string, string> | null = null;

function keyMap(): Record<string, string> {
  if (cache) return cache;
  const raw = process.env.DEMO_KEYS;
  if (!raw) {
    cache = {};
    return cache;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    cache =
      parsed && typeof parsed === "object"
        ? (parsed as Record<string, string>)
        : {};
  } catch {
    cache = {};
  }
  return cache;
}

/**
 * Vrai si `key` ouvre la simulation de `slug`. Comparaison stricte par slug ;
 * fallback sur la clé globale héritée si aucune clé par slug n'est configurée.
 */
export function isValidDemoKey(slug: string, key: string | undefined): boolean {
  if (!key) return false;
  const perSlug = keyMap()[slug];
  if (perSlug) return key === perSlug;
  // Fallback hérité : une seule clé pour toutes les maisons.
  return Boolean(process.env.DEMO_KEY) && key === process.env.DEMO_KEY;
}
