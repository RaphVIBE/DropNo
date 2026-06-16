import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getLegalDoc } from "@/lib/legal";
import { localizedAlternates } from "@/lib/i18n/metadata";
import { LegalDocument } from "@/components/legal/legal-document";

// Slug attendu par Stripe Connect. Sert le même document que /confidentialite.
const DOC_SLUG = "politique-confidentialite";

export async function generateMetadata(): Promise<Metadata> {
  const doc = getLegalDoc(DOC_SLUG)!;
  return {
    title: `${doc.title} · Drop No.`,
    description: doc.description,
    alternates: localizedAlternates("/privacy-policy", await getLocale()),
  };
}

export default function PrivacyPolicyPage() {
  return <LegalDocument slug={DOC_SLUG} />;
}
