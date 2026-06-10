/**
 * Story marque + fiche technique. La description est decoupee en paragraphes
 * (separes par double saut de ligne). Les specs viennent de drops.specs (JSON
 * objet cle->valeur), affichees en dl si presentes.
 */
export function DropDetail({
  description,
  specs,
}: {
  description: string | null;
  specs: Record<string, unknown> | null;
}) {
  const paragraphs = (description ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const specEntries =
    specs && typeof specs === "object" && !Array.isArray(specs)
      ? Object.entries(specs).filter(([, v]) => v != null && v !== "")
      : [];

  if (paragraphs.length === 0 && specEntries.length === 0) return null;

  return (
    <div className="border-t border-rule-soft px-7 py-24 md:px-16 md:py-32">
      <div className="grid max-w-6xl grid-cols-1 gap-16 md:grid-cols-[1fr_1.4fr] md:gap-24">
        <div>
          <span className="eyebrow">La pièce</span>
          <h3 className="font-display mt-4 text-[clamp(2rem,4vw,3rem)]">
            Une ligne, peu de mots.
          </h3>
        </div>
        <div>
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="max-w-[60ch] text-base leading-relaxed text-ink-2 [&+p]:mt-4"
            >
              {p}
            </p>
          ))}
          {specEntries.length > 0 ? (
            <dl className="mt-8 grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr] md:grid-cols-[180px_1fr]">
              {specEntries.map(([key, value]) => (
                <DefRow key={key} term={key} def={String(value)} />
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DefRow({ term, def }: { term: string; def: string }) {
  return (
    <>
      <dt className="border-t border-rule-soft py-3.5 text-sm tracking-wide text-muted-foreground">
        {term}
      </dt>
      <dd className="border-t border-rule-soft py-3.5 font-serif text-[17px] italic text-foreground">
        {def}
      </dd>
    </>
  );
}
