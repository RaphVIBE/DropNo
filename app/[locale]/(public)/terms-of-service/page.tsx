import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getLegalDoc } from "@/lib/legal";
import { localizedAlternates } from "@/lib/i18n/metadata";
import { LegalDocument } from "@/components/legal/legal-document";

// Slug attendu par Stripe Connect. Sert les CGU (lien vers les CGV dans le
// corps du document et la navigation « Autres documents »).
const DOC_SLUG = "cgu";

export async function generateMetadata(): Promise<Metadata> {
  const doc = getLegalDoc(DOC_SLUG)!;
  return {
    title: `${doc.title} · Drop No.`,
    description: doc.description,
    alternates: localizedAlternates("/terms-of-service", await getLocale()),
  };
}

export default function TermsOfServicePage() {
  return <LegalDocument slug={DOC_SLUG} />;
}
