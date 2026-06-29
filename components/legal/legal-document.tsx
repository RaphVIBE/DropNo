import { promises as fs } from "fs";
import path from "path";

import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { LEGAL_DOCS, getLegalDoc } from "@/lib/legal";
import { renderMarkdown } from "@/lib/markdown";
import { Masthead } from "@/components/brand/masthead";

/**
 * Rendu d'un document légal (Masthead + corps prose + navigation vers les
 * autres documents). Mutualisé entre :
 *  - la route catalogue `/legal/[slug]` ;
 *  - les routes au slug attendu par Stripe (`/privacy-policy`, `/cgv`, …).
 *
 * Le contenu vit dans le repo (`content/legal/*.md`) et n'a pas de frontmatter :
 * on réutilise le renderer maison `lib/markdown.ts` (titres, listes, tableaux,
 * inline) plutôt qu'une dépendance externe.
 */
export async function LegalDocument({ slug }: { slug: string }) {
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  const raw = await fs.readFile(
    path.join(process.cwd(), "content/legal", doc.file),
    "utf-8"
  );
  // Le H1 du markdown est porté par le Masthead : on l'enlève du corps.
  const body = renderMarkdown(raw.replace(/^#\s+.*\n/, ""));

  return (
    <>
      {/* En-tête — bande sable + filigrane « sceau / authenticité » */}
      <Masthead variant="seal" padding="px-7 pb-14 pt-20 md:pb-16 md:pt-24">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Drop No. · Documents</span>
          <h1 className="font-display mt-4 text-display-page">
            {doc.title}
          </h1>
        </div>
      </Masthead>

      <section className="mx-auto max-w-3xl px-7 pb-28 pt-14 md:pt-16">
        <div
          className="legal-prose"
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
    </>
  );
}
