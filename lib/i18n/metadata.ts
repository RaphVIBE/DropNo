import type { Metadata } from "next";

/** URL publique du site, sans slash final. */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://dropno.eu"
  ).replace(/\/$/, "");
}

/** Image OG par défaut (absolue), servie statiquement depuis /public. */
export function defaultOgImage(): string {
  return `${siteUrl()}/og-default.png`;
}

/**
 * Construit `canonical` + alternates `hreflang` (FR / EN / x-default) pour une
 * page localisée, rendus dans le <head> par Next (`alternates.languages`).
 * Complète le header HTTP `Link` déjà posé par le middleware next-intl.
 *
 * @param path   chemin "nu" sans préfixe de locale ("/" pour la home, "/mecanisme"…)
 * @param locale locale courante, pour le canonical
 * @param availableLocales locales pour lesquelles ce contenu existe RÉELLEMENT.
 *   Par défaut bilingue (`["fr", "en"]`). Pour un contenu mono-langue (un essai
 *   FR-only dont l'URL /en/... sert tout de même le corps français), passer
 *   `["fr"]` : on n'émet alors qu'un hreflang `fr` + `x-default`, et le canonical
 *   de l'URL /en pointe vers la version FR (pas d'hreflang `en` trompeur ni de
 *   duplicate content fr/en sur un même corps).
 */
export function localizedAlternates(
  path: string,
  locale: string,
  availableLocales: readonly string[] = ["fr", "en"]
): Metadata["alternates"] {
  const base = siteUrl();
  const clean = path === "/" ? "" : path;
  const fr = `${base}${clean}` || base;
  const en = `${base}/en${clean}`;

  const hasFr = availableLocales.includes("fr");
  const hasEn = availableLocales.includes("en");

  const languages: NonNullable<Metadata["alternates"]>["languages"] = {};
  if (hasFr) languages.fr = fr || base;
  if (hasEn) languages.en = en;
  // x-default : la langue de référence (FR si disponible, sinon EN).
  languages["x-default"] = hasFr ? fr || base : en;

  // Canonical : si la locale courante n'a pas de variante propre, on canonise
  // vers la version réellement disponible (FR par défaut) pour éviter que deux
  // URLs fr/en servant le même corps soient indexées séparément.
  const canonical =
    locale === "en" && hasEn ? en : hasFr ? fr || base : en;

  return { canonical, languages };
}
