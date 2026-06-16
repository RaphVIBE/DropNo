import type { Metadata } from "next";

import { LEGAL_DOCS, getLegalDoc } from "@/lib/legal";
import { LegalDocument } from "@/components/legal/legal-document";

/**
 * Pages légales — catalogue `/legal/[slug]`. Rendues statiquement au build
 * (le contenu vit dans le repo, content/legal/*.md). Les mêmes documents sont
 * aussi servis aux slugs attendus par Stripe (voir routes sœurs : /cgv,
 * /privacy-policy, …).
 */

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const doc = getLegalDoc(params.slug);
  if (!doc) return { title: "Document introuvable · Drop No." };
  return { title: `${doc.title} · Drop No.`, description: doc.description };
}

export default async function LegalPage({
  params,
}: {
  params: { slug: string };
}) {
  return <LegalDocument slug={params.slug} />;
}
