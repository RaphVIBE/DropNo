import type { Metadata } from "next";
import Link from "next/link";

import { MechanismVariantB } from "@/components/home/mechanism-variant-b";
import { Filigrane } from "@/components/brand/filigrane";
import { formatEuros } from "@/lib/format";

export const metadata: Metadata = {
  title: "Le mécanisme · Drop No.",
  description:
    "Offre scellée, révélation, prix unique : comment fonctionne un drop Drop No., avec un exemple chiffré.",
};

/**
 * Page pédagogique : le mécanisme sealed-bid uniform price expliqué en entier,
 * avec un exemple chiffré et une FAQ. Statique, aucune donnée.
 */

// Exemple chiffré : 5 exemplaires, plancher 3 000 €. Les montants sont en
// cents (convention CLAUDE.md), formatés à l'affichage.
const EXAMPLE_N = 5;
const EXAMPLE_FLOOR_CENTS = 300_000;
const EXAMPLE_BIDS_CENTS = [620_000, 540_000, 490_000, 460_000, 410_000, 380_000, 320_000];
const CLEARING_CENTS = EXAMPLE_BIDS_CENTS[EXAMPLE_N - 1];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Que se passe-t-il si je ne gagne pas ?",
    a: "Rien. La pré-autorisation posée sur votre carte est libérée dans les meilleurs délais et vous n'êtes débité de rien. Participer ne coûte rien.",
  },
  {
    q: "Pourquoi une pré-autorisation au moment de l'offre ?",
    a: "Elle garantit que chaque offre est sérieuse : le montant exact de votre offre est réservé sur votre carte, sans débit. Si vous gagnez, seul le prix unique (souvent inférieur à votre offre) est capturé. Sinon, tout est libéré.",
  },
  {
    q: "Pourquoi une vérification d'identité ?",
    a: "La réglementation européenne sur les biens de luxe (lutte anti-blanchiment) impose de vérifier l'identité des acheteurs. C'est fait une seule fois, via Stripe Identity : une pièce d'identité, un selfie, quelques minutes.",
  },
  {
    q: "Puis-je modifier mon offre ?",
    a: "Oui, autant de fois que vous voulez, jusqu'à une heure avant la révélation. Passé ce verrou, les offres sont figées.",
  },
  {
    q: "Combien payent les gagnants, exactement ?",
    a: "Tous les gagnants payent le même montant : celui de la dernière offre gagnante, c'est-à-dire la plus basse parmi les retenues. Si vous avez offert davantage, vous payez quand même ce prix unique, jamais votre montant.",
  },
  {
    q: "Et si je change d'avis après la livraison ?",
    a: "Vous disposez du droit de rétractation européen : 14 jours après réception, remboursement intégral, sans frais de réapprovisionnement.",
  },
  {
    q: "Combien coûte Drop No. pour l'acheteur ?",
    a: "Zéro. Aucun frais acheteur : le prix unique affiché est le prix payé. La commission de la plateforme est à la charge de la maison.",
  },
];

export default function MechanismPage() {
  return (
    <>
      {/* En-tête éditorial */}
      <div className="relative overflow-hidden border-b border-rule-soft px-7 pb-16 pt-20 md:px-16 md:pb-20 md:pt-28">
        <Filigrane className="reveal-art pointer-events-none absolute -right-10 top-1/2 z-0 h-60 w-60 -translate-y-1/2 text-[var(--champagne-deep)] [--art-opacity:0.07] md:-right-4 md:h-80 md:w-80" />
        <div className="relative z-10">
          <span
            className="eyebrow reveal"
            style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
          >
            Le mécanisme
          </span>
          <h1
            className="font-display reveal mt-6 max-w-[14ch] text-[clamp(2.75rem,7vw,5.5rem)]"
            style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
          >
            Un prix juste naît scellé.
          </h1>
          <p
            className="reveal mt-6 max-w-[54ch] text-lg leading-relaxed text-ink-2"
            style={{ "--reveal-delay": "380ms" } as React.CSSProperties}
          >
            Pas d&apos;enchères en direct, pas de course contre la montre.
            Chacun scelle l&apos;offre que la pièce vaut pour lui ; à la
            révélation, les plus hautes gagnent et toutes payent le même prix.
          </p>
        </div>
      </div>

      {/* Les trois temps */}
      <section className="px-7 py-16 md:px-16 md:py-20">
        <MechanismVariantB />
      </section>

      {/* Exemple chiffré */}
      <section className="border-t border-rule-soft px-7 py-16 md:px-16 md:py-24">
        <div className="grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr] md:gap-24">
          <div>
            <span className="eyebrow">Exemple</span>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,2.75rem)]">
              Cinq exemplaires, sept offres.
            </h2>
            <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-ink-2">
              Une maison ouvre un drop de {EXAMPLE_N} exemplaires, prix
              plancher {formatEuros(EXAMPLE_FLOOR_CENTS)}. À la révélation,
              les offres sont triées. Les {EXAMPLE_N} plus hautes gagnent, et
              toutes payent le montant de la {EXAMPLE_N}ᵉ :{" "}
              <span className="text-foreground">
                {formatEuros(CLEARING_CENTS)}
              </span>
              . Offrir plus n&apos;augmente jamais votre facture, seulement vos
              chances.
            </p>
          </div>

          <ol className="self-start" aria-label="Offres triées à la révélation">
            {EXAMPLE_BIDS_CENTS.map((cents, i) => {
              const rank = i + 1;
              const isWinner = rank <= EXAMPLE_N;
              const isClearing = rank === EXAMPLE_N;
              return (
                <li
                  key={cents}
                  className={`flex items-baseline justify-between gap-4 border-b border-rule-soft py-3.5 ${
                    isClearing ? "border-b-champagne-deep" : ""
                  }`}
                >
                  <span className="flex items-baseline gap-4">
                    <span className="w-6 shrink-0 font-serif text-sm italic tabular-nums text-muted-foreground">
                      {String(rank).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-serif text-xl italic tabular-nums ${
                        isWinner ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {formatEuros(cents)}
                    </span>
                  </span>
                  <span
                    className={`text-[11px] uppercase tracking-[0.18em] ${
                      isClearing
                        ? "text-champagne-deep"
                        : isWinner
                          ? "text-ink-2"
                          : "text-muted-foreground"
                    }`}
                  >
                    {isClearing
                      ? `Prix unique · ${formatEuros(CLEARING_CENTS)}`
                      : isWinner
                        ? `Gagne · paye ${formatEuros(CLEARING_CENTS)}`
                        : "Libérée, rien à payer"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Chronologie d'un drop */}
      <section className="border-t border-rule-soft px-7 py-16 md:px-16 md:py-24">
        <span className="eyebrow">Chronologie</span>
        <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,2.75rem)]">
          Cinq jours, une révélation.
        </h2>
        <ol className="mt-10 grid max-w-5xl grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10">
          {[
            {
              t: "Jour 1",
              title: "Ouverture",
              body: "Le drop ouvre : pièce, exemplaires et prix plancher sont publics. La fenêtre d'offres dure cinq jours.",
            },
            {
              t: "Jours 1 à 5",
              title: "Offres scellées",
              body: "Vous scellez votre offre, invisible de tous, modifiable à volonté jusqu'à une heure avant la révélation.",
            },
            {
              t: "T − 1 h",
              title: "Verrouillage",
              body: "Les offres sont figées. Plus aucune soumission ni modification : le tri peut commencer.",
            },
            {
              t: "Révélation",
              title: "Prix unique",
              body: "Les gagnants sont notifiés et payent tous le même prix. Les autres pré-autorisations sont libérées.",
            },
          ].map((step, i) => (
            <li key={step.t} className="border-t border-rule pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {step.t}
                </span>
                <span className="font-serif text-sm italic tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-3 font-serif text-xl italic">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="border-t border-rule-soft px-7 py-16 md:px-16 md:py-24">
        <div className="grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr] md:gap-24">
          <div>
            <span className="eyebrow">Questions</span>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,2.75rem)]">
              Ce que l&apos;on nous demande.
            </h2>
          </div>
          <div>
            {FAQ.map((item) => (
              <details key={item.q} className="group border-b border-rule-soft">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 rounded-sm py-5 [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span className="font-serif text-lg italic transition-colors group-hover:text-champagne-deep">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-6 text-[15px] leading-relaxed text-ink-2">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-rule-soft px-7 py-20 text-center md:px-16 md:py-28">
        <p className="font-display mx-auto max-w-[20ch] text-[clamp(1.75rem,4vw,2.75rem)]">
          Le prochain drop est déjà au calendrier.
        </p>
        <Link
          href="/drops"
          className="mt-9 inline-block bg-primary px-10 py-[18px] text-[13px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Voir le calendrier
        </Link>
      </section>
    </>
  );
}
