import { promises as fs } from "fs";
import path from "path";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LEGAL_DOCS, getLegalDoc } from "@/lib/legal";
import { renderMarkdown } from "@/lib/markdown";

/**
 * Pages légales — rendues statiquement au build (le contenu vit dans le repo,
 * content/legal/*.md). Pas de fetch runtime : generateStaticParams suffit.
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
  const doc = getLegalDoc(params.slug);
  if (!doc) notFound();

  const raw = await fs.readFile(
    path.join(process.cwd(), "content/legal", doc.file),
    "utf-8"
  );
  // Le H1 du markdown est porté par la page : on l'enlève du corps.
  const body = renderMarkdown(raw.replace(/^#\s+.*\n/, ""));

  return (
    <section className="mx-auto max-w-3xl px-7 pb-28 pt-20 md:pt-24">
      <span className="eyebrow">Drop No. · Documents</span>
      <h1 className="font-display mt-4 text-[clamp(2.25rem,5vw,3.5rem)]">
        {doc.title}
      </h1>

      <div
        className="legal-prose mt-12"
        dangerouslySetInnerHTML={{ __html: body }}
      />

      <nav
        aria-label="Autres documents"
        className="mt-20 border-t border-rule-soft pt-8"
      >
        <span className="eyebrow">Autres documents</span>
        <ul className="mt-4 flex flex-wrap gap-x-7 gap-y-2">
          {LEGAL_DOCS.filter((d) => d.slug !== doc.slug).map((d) => (
            <li key={d.slug}>
              <Link
                href={`/legal/${d.slug}`}
                className="rounded-sm text-sm text-ink-2 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
