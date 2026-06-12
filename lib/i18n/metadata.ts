import type { Metadata } from "next";

/** URL publique du site, sans slash final. */
function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://dropno.eu"
  ).replace(/\/$/, "");
}

/**
 * Construit `canonical` + alternates `hreflang` (FR / EN / x-default) pour une
 * page localisée, rendus dans le <head> par Next (`alternates.languages`).
 * Complète le header HTTP `Link` déjà posé par le middleware next-intl.
 *
 * @param path   chemin "nu" sans préfixe de locale ("/" pour la home, "/mecanisme"…)
 * @param locale locale courante, pour le canonical
 */
export function localizedAlternates(
  path: string,
  locale: string
): Metadata["alternates"] {
  const base = siteUrl();
  const clean = path === "/" ? "" : path;
  const fr = `${base}${clean}` || base;
  const en = `${base}/en${clean}`;
  return {
    canonical: locale === "en" ? en : fr || base,
    languages: {
      fr: fr || base,
      en,
      "x-default": fr || base,
    },
  };
}
