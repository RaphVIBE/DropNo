/**
 * Résout la locale courante côté client, sans contexte next-intl.
 *
 * Pensé pour les fichiers spéciaux Next (error.tsx, global-error.tsx) qui sont
 * des composants client rendus en dehors de la chaîne i18n serveur. On lit
 * d'abord la langue du document (posée par le layout racine via getLocale),
 * puis on retombe sur le préfixe de chemin (`/en`). Défaut : FR (racine).
 */
export type ClientLocale = "fr" | "en";

export function clientLocale(): ClientLocale {
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang?.toLowerCase();
    if (lang?.startsWith("en")) return "en";
    if (lang?.startsWith("fr")) return "fr";
  }
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/en")) return "en";
  }
  return "fr";
}
