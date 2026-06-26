import type { ReactNode } from "react";

/**
 * Rendu Markdown minimal pour les essais `/lire`. Suffisant pour notre format
 * éditorial : titres `##`, paragraphes, séparateurs `---`, emphase `*...*` et
 * **gras**. Pas de dépendance externe (le corpus est maîtrisé en interne).
 *
 * Colonne mesurée (max ~66 caractères), corps en serif Fraunces pour la
 * longue lecture, rythme vertical généreux. Cohérent avec les tokens vitrine.
 */

/** Convertit l'emphase inline (`*x*`, `**x**`) en éléments React. */
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Découpe sur **gras** puis *italique*, en conservant les délimiteurs.
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  tokens.forEach((tok, i) => {
    if (/^\*\*[^*]+\*\*$/.test(tok)) {
      nodes.push(
        <strong key={i} className="font-medium text-foreground">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (/^\*[^*]+\*$/.test(tok)) {
      nodes.push(<em key={i}>{tok.slice(1, -1)}</em>);
    } else {
      nodes.push(tok);
    }
  });
  return nodes;
}

export function EssayProse({ body }: { body: string }) {
  // Blocs séparés par lignes vides.
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="essay-prose mx-auto max-w-[34rem]">
      {blocks.map((block, i) => {
        if (block === "---") {
          return (
            <hr
              key={i}
              className="mx-auto my-14 w-16 border-0 border-t border-champagne-deep/60"
            />
          );
        }
        if (block.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="font-serif mt-12 text-2xl italic leading-snug text-foreground"
            >
              {renderInline(block.slice(4))}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="font-serif mt-16 text-[clamp(1.6rem,3.4vw,2.1rem)] italic leading-tight text-foreground"
            >
              {renderInline(block.slice(3))}
            </h2>
          );
        }
        // Paragraphe (les retours simples internes deviennent des espaces).
        const paragraph = block.replace(/\n/g, " ");
        return (
          <p
            key={i}
            className="mt-6 font-serif text-[1.18rem] leading-[1.85] text-ink-2 first:mt-0"
          >
            {renderInline(paragraph)}
          </p>
        );
      })}
    </div>
  );
}
