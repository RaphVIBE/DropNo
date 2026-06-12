import Link from "next/link";

/**
 * Réassurance au point de décision : ce qui est compris quand on scelle une
 * offre à 3 000 €+. Volontairement discret (liste hairline, pas de cartes),
 * placé sous le formulaire d'offre.
 */

const ITEMS: { label: string; detail: string }[] = [
  {
    label: "Authenticité",
    detail: "Pièce en direct de la maison, jamais de revente",
  },
  {
    label: "Livraison",
    detail: "Assurée porte à porte, main propre au-delà de 10 000 €",
  },
  {
    label: "Rétractation",
    detail: "14 jours après réception, remboursement intégral",
  },
  {
    label: "Frais acheteur",
    detail: "Aucun : le prix unique affiché est le prix payé",
  },
];

export function DropAssurance() {
  return (
    <div className="mt-8">
      <dl>
        {ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-baseline gap-4 border-t border-rule-soft py-3"
          >
            <dt className="w-[92px] shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="text-[13px] leading-relaxed text-ink-2">
              {item.detail}
            </dd>
          </div>
        ))}
      </dl>
      <Link
        href="/mecanisme"
        className="mt-4 inline-block rounded-sm text-[13px] text-ink-2 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Comment fonctionne un drop →
      </Link>
    </div>
  );
}
