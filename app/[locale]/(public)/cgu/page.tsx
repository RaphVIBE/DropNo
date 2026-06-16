import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { getLegalDoc } from "@/lib/legal";
import { localizedAlternates } from "@/lib/i18n/metadata";
import { LegalDocument } from "@/components/legal/legal-document";

// Alias FR de /terms-of-service.
const DOC_SLUG = "cgu";

export async function generateMetadata(): Promise<Metadata> {
  const doc = getLegalDoc(DOC_SLUG)!;
  return {
    title: `${doc.title} · Drop No.`,
    description: doc.description,
    alternates: localizedAlternates("/cgu", await getLocale()),
  };
}

export default function CguPage() {
  return <LegalDocument slug={DOC_SLUG} />;
}
