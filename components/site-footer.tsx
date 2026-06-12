import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";
import { LEGAL_DOCS } from "@/lib/legal";

/**
 * Pied de page global du site vitrine. Sobre, structuré par hairlines :
 * la maison, l'exploration, les engagements (réassurance), le légal.
 * Server Component, aucune dépendance client.
 */

const EXPLORE = [
  { href: "/drops", label: "Calendrier des drops" },
  { href: "/marques", label: "Maisons" },
  { href: "/mecanisme", label: "Le mécanisme" },
  { href: "/a-propos", label: "À propos" },
];

const COMMITMENTS = [
  "Pièces en direct des maisons, jamais de revente",
  "Paiement sécurisé et identité vérifiée (Stripe)",
  "Livraison assurée, main propre au-delà de 10 000 €",
  "Rétractation 14 jours, remboursement intégral",
];

const LINK_CLASS =
  "rounded-sm text-sm text-ink-2 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-rule bg-background">
      <div className="grid grid-cols-1 gap-x-12 gap-y-12 px-7 py-16 md:grid-cols-[1.3fr_1fr_1.4fr] md:px-16 md:py-20">
        {/* La maison */}
        <div>
          <Link
            href="/"
            className="inline-block rounded-sm text-[26px] text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Wordmark />
          </Link>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-ink-2">
            Maison de drops scellés pour montres premium. Une pièce par
            semaine, un prix unique décidé à la révélation.
          </p>
          <a href="mailto:hello@dropno.eu" className={`mt-5 inline-block ${LINK_CLASS}`}>
            hello@dropno.eu
          </a>
        </div>

        {/* Explorer */}
        <nav aria-label="Pied de page">
          <span className="eyebrow">Explorer</span>
          <ul className="mt-5 space-y-3">
            {EXPLORE.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={LINK_CLASS}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Engagements */}
        <div>
          <span className="eyebrow">Nos engagements</span>
          <ul className="mt-5 space-y-3">
            {COMMITMENTS.map((c) => (
              <li key={c} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                <span
                  aria-hidden
                  className="mt-[9px] h-px w-4 shrink-0 bg-champagne-deep"
                />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Filet légal */}
      <div className="flex flex-col gap-4 border-t border-rule-soft px-7 py-7 md:flex-row md:items-baseline md:justify-between md:px-16">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL_DOCS.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/legal/${d.slug}`}
                className="rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
        <p className="shrink-0 text-xs text-muted-foreground">
          © {year} Drop No. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
