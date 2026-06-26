import { defaultOgImage, siteUrl } from "@/lib/i18n/metadata";

/**
 * Constructeurs de structured data schema.org.
 *
 * Note réseaux sociaux : `sameAs` reste vide tant que les comptes officiels
 * (LinkedIn, Instagram, X) ne sont pas confirmés par l'owner. À compléter dès
 * que les handles sont arrêtés (voir rapport — décision owner en attente).
 */

const SAME_AS: string[] = [
  // TODO(owner): ajouter les URLs des comptes officiels confirmés, p. ex.
  // "https://www.instagram.com/dropno", "https://www.linkedin.com/company/dropno"
];

/** Organization — posée une fois sur le layout racine. */
export function organizationJsonLd(): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Drop No.",
    url: base,
    logo: `${base}/dropno-logo.png`,
    description:
      "Maison de drops scellés pour l'horlogerie premium, en vente directe par les marques.",
    ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
  };
}

/** WebSite — permet à Google d'associer le nom du site (sitelinks). */
export function webSiteJsonLd(): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Drop No.",
    url: base,
    inLanguage: ["fr", "en"],
  };
}

/** Maillon de fil d'Ariane. */
type Crumb = { name: string; url: string };

/** BreadcrumbList pour les pages profondes. */
export function breadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

/**
 * Fiche drop.
 *
 * Choix de type : **Product** avec une `Offer` (et non `Event`).
 * Un drop est avant tout un produit (une montre identifiée d'une maison) que
 * l'on peut acquérir. Schema.org recommande Product/Offer pour les pages
 * d'achat, et Google en tire des rich results « produit ». La fenêtre datée
 * (ouverture → révélation jeudi 18h CET) est portée par `Offer.availabilityStarts`
 * / `priceValidUntil`, ce qui exprime la temporalité sans détourner le type
 * Event (réservé aux évènements auxquels on assiste). Le plancher est exposé
 * via `priceSpecification` (MinimumAdvertisedPrice) : le prix final (clearing)
 * n'est jamais publié avant la révélation, conformément aux règles produit.
 */
export function dropJsonLd(opts: {
  id: string;
  title: string;
  brandName: string | null;
  description: string | null;
  floorPriceCents: number | null;
  status: string;
  opensAt: string | null;
  revealAt: string | null;
  imageUrl: string | null;
}): Record<string, unknown> {
  const base = siteUrl();
  const url = `${base}/drop/${opts.id}`;

  // availability : achat possible tant que le drop est ouvert.
  const availability =
    opts.status === "open"
      ? "https://schema.org/InStock"
      : opts.status === "scheduled"
        ? "https://schema.org/PreOrder"
        : "https://schema.org/SoldOut";

  const floorEuros =
    opts.floorPriceCents != null
      ? (opts.floorPriceCents / 100).toFixed(2)
      : null;

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    url,
    priceCurrency: "EUR",
    availability,
    ...(floorEuros
      ? {
          // Plancher annoncé : l'offre n'est pas en dessous de ce prix.
          priceSpecification: {
            "@type": "PriceSpecification",
            minPrice: floorEuros,
            priceCurrency: "EUR",
          },
        }
      : {}),
    ...(opts.opensAt ? { availabilityStarts: opts.opensAt } : {}),
    ...(opts.revealAt ? { priceValidUntil: opts.revealAt } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.title,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.brandName ? { brand: { "@type": "Brand", name: opts.brandName } } : {}),
    ...(opts.imageUrl ? { image: opts.imageUrl } : { image: defaultOgImage() }),
    offers: offer,
  };
}

/** Article éditorial `/lire/[slug]`. */
export function articleJsonLd(opts: {
  slug: string;
  title: string;
  description: string;
  publishedAt: string | null;
  inLanguage: string;
  imageUrl?: string;
}): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    inLanguage: opts.inLanguage,
    mainEntityOfPage: `${base}/lire/${opts.slug}`,
    image: opts.imageUrl ?? defaultOgImage(),
    ...(opts.publishedAt ? { datePublished: opts.publishedAt } : {}),
    author: { "@type": "Organization", name: "Drop No." },
    publisher: {
      "@type": "Organization",
      name: "Drop No.",
      logo: { "@type": "ImageObject", url: `${base}/dropno-logo.png` },
    },
  };
}
