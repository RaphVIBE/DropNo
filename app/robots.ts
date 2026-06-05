import type { MetadataRoute } from "next";

/**
 * Phase de construction : on interdit l'indexation de tout le site.
 * À l'ouverture publique, remplacer par une règle autorisant l'indexation
 * (allow: "/") et déclarer le sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
