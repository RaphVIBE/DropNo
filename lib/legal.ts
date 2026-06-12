/**
 * Registre des documents légaux servis sur /legal/[slug].
 * Source : content/legal/*.md (drafts, à faire valider par un juriste
 * e-commerce EU avant launch — voir content/legal/README.md).
 */

export type LegalDoc = {
  slug: string;
  file: string;
  title: string;
  description: string;
};

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "mentions-legales",
    file: "mentions-legales.md",
    title: "Mentions légales",
    description: "Éditeur, hébergement et contacts du site Drop No.",
  },
  {
    slug: "cgu",
    file: "cgu.md",
    title: "Conditions générales d'utilisation",
    description: "Règles d'utilisation de la plateforme Drop No.",
  },
  {
    slug: "cgv",
    file: "cgv.md",
    title: "Conditions générales de vente",
    description:
      "Mécanisme des drops scellés, prix unique, paiement et livraison.",
  },
  {
    slug: "politique-confidentialite",
    file: "politique-confidentialite.md",
    title: "Politique de confidentialité",
    description: "Données collectées, finalités, durées et droits RGPD.",
  },
  {
    slug: "politique-cookies",
    file: "politique-cookies.md",
    title: "Politique de cookies",
    description: "Cookies et traceurs utilisés sur Drop No.",
  },
  {
    slug: "retractation",
    file: "retractation.md",
    title: "Droit de rétractation",
    description: "Rétractation 14 jours et modalités de retour.",
  },
];

export function getLegalDoc(slug: string): LegalDoc | null {
  return LEGAL_DOCS.find((d) => d.slug === slug) ?? null;
}
