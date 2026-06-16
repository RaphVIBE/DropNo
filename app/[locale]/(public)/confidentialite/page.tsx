import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getLegalDoc } from "@/lib/legal";
import { localizedAlternates } from "@/lib/i18n/metadata";
import { LegalDocument } from "@/components/legal/legal-document";

// Alias FR de /privacy-policy.
const DOC_SLUG = "politique-confidentialite";

export async function generateMetadata(): Promise<Metadata> {
  const doc = getLegalDoc(DOC_SLUG)!;
  return {
    title: `${doc.title} · Drop No.`,
    description: doc.description,
    alternates: localizedAlternates("/confidentialite", await getLocale()),
  };
}

export default function ConfidentialitePage() {
  return <LegalDocument slug={DOC_SLUG} />;
}
