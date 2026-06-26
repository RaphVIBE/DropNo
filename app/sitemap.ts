import type { MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";
import { getAllEssays } from "@/lib/essays";
import { siteUrl } from "@/lib/i18n/metadata";

export const dynamic = "force-dynamic";

/**
 * Sitemap bilingue FR (racine) + EN (/en), avec alternates hreflang par URL.
 *
 * Gating : le sitemap peut exister même pendant le soft-launch — `robots.ts`
 * reste en disallow tant que SITE_LOCKED. On prépare le terrain pour l'étape
 * « indexed » sans rien exposer prématurément.
 *
 * Couvre : pages statiques + drops publics (vue `drops_public`, hors démo),
 * maisons actives (/marques/[slug]) et essais (/lire/[slug]).
 */

const STATIC_PATHS = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/drops", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/marques", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/mecanisme", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/a-propos", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/lire", priority: 0.6, changeFrequency: "weekly" as const },
];

/**
 * Construit une entrée avec ses alternates hreflang.
 *
 * `availableLocales` : locales pour lesquelles le contenu existe réellement
 * (défaut bilingue `["fr", "en"]`). Un contenu FR-only (essai sans variante
 * `.en.md`) passe `["fr"]` : on n'annonce alors qu'un alternate `fr` +
 * `x-default`, en cohérence avec le `<head>` de la page (pas de paire fr/en
 * trompeuse pour un même corps français).
 */
function entry(
  path: string,
  opts: {
    lastModified?: string | Date;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
    availableLocales?: readonly string[];
  } = {}
): MetadataRoute.Sitemap[number] {
  const base = siteUrl();
  const clean = path === "/" ? "" : path;
  const fr = `${base}${clean}` || base;
  const en = `${base}/en${clean}`;
  const available = opts.availableLocales ?? ["fr", "en"];
  const hasFr = available.includes("fr");
  const hasEn = available.includes("en");

  const languages: Record<string, string> = {};
  if (hasFr) languages.fr = fr;
  if (hasEn) languages.en = en;
  languages["x-default"] = hasFr ? fr : en;

  return {
    url: fr,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items: MetadataRoute.Sitemap = STATIC_PATHS.map((s) =>
    entry(s.path, { priority: s.priority, changeFrequency: s.changeFrequency })
  );

  // Drops publics (hors démo). Lecture via la vue publique, pas de secret.
  try {
    const supabase = createClient();
    const { data: drops } = await supabase
      .from("drops_public")
      .select("id, revealed_at, reveal_at")
      .eq("is_demo", false);
    for (const d of drops ?? []) {
      const last = d.revealed_at ?? d.reveal_at ?? undefined;
      items.push(
        entry(`/drop/${d.id}`, {
          lastModified: last ?? undefined,
          changeFrequency: "daily",
          priority: 0.8,
        })
      );
    }

    // Maisons actives (hors démo).
    const { data: brands } = await supabase
      .from("brands")
      .select("slug")
      .eq("status", "active")
      .eq("is_demo", false);
    for (const b of brands ?? []) {
      if (!b.slug) continue;
      items.push(
        entry(`/marques/${b.slug}`, {
          changeFrequency: "weekly",
          priority: 0.6,
        })
      );
    }
  } catch {
    // En cas d'indisponibilité DB, on sert au moins les pages statiques.
  }

  // Essais éditoriaux.
  try {
    const essays = await getAllEssays();
    for (const e of essays) {
      items.push(
        entry(`/lire/${e.slug}`, {
          lastModified: e.publishedAt ?? undefined,
          changeFrequency: "monthly",
          priority: 0.5,
          // Essai mono-langue : n'annonce que sa langue réelle.
          availableLocales: [e.lang],
        })
      );
    }
  } catch {
    // pas d'essai indexé si la lecture échoue
  }

  return items;
}
