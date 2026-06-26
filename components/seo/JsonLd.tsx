/**
 * Injecte du structured data schema.org dans un <script type="application/ld+json">.
 * Composant serveur réutilisable : on lui passe l'objet JSON-LD déjà construit.
 *
 * Le JSON est sérialisé avec un échappement de `<` pour neutraliser toute
 * tentative de fermeture prématurée de balise (defense-in-depth, même si les
 * données proviennent de sources de confiance).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
