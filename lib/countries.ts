/**
 * Libellé FR d'un code pays ISO 3166-1 alpha-2 (brands.country_code).
 * Liste volontairement courte (pays horlogers fréquents) ; fallback = le code.
 */
const NAMES: Record<string, string> = {
  CH: "Suisse",
  FR: "France",
  DE: "Allemagne",
  GB: "Royaume-Uni",
  IT: "Italie",
  JP: "Japon",
  US: "États-Unis",
  AT: "Autriche",
  SE: "Suède",
  DK: "Danemark",
  ES: "Espagne",
  BE: "Belgique",
  NL: "Pays-Bas",
  FI: "Finlande",
};

export function countryLabel(code?: string | null): string | null {
  if (!code) return null;
  return NAMES[code.toUpperCase()] ?? code.toUpperCase();
}
