import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatEuros } from "@/lib/format";
import { NextDropCard, NumberedSteps, RevealHero } from "@/components/reveal/shared";

/*
 * Ecran « offre sous le plancher » (jamais entree dans l'enchere).
 * Graphe a 2 points : votre offre (gauche) sous la ligne de plancher (droite),
 * suivi du rappel pedagogique en trois temps (cf. dropno-buyer-reveal-below-floor.html).
 */

export type RevealBelowFloorProps = {
  locale: string;
  dropNumber: number;
  revealTime: string;
  bidCents: number;
  floorCents: number;
  /** Clearing du drop si connu (les autres ont gagne) : alimente le 2e temps. */
  clearingCents: number | null;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export async function RevealBelowFloor(props: RevealBelowFloorProps) {
  const t = await getTranslations("reveal");
  const { locale, bidCents, floorCents, clearingCents } = props;

  // L'offre est sous le plancher : on la place dans la moitie gauche,
  // proportionnellement a son ecart au plancher. Plancher ancre a droite.
  const bidLeft = clamp((bidCents / floorCents) * 45, 12, 44);

  const strong = (c: ReactNode) => (
    <strong className="font-medium text-foreground">{c}</strong>
  );

  const steps: { heading: ReactNode; body: ReactNode }[] = [
    { heading: t("ex1Heading"), body: t("ex1Body") },
  ];
  if (clearingCents != null) {
    steps.push({
      heading: t("ex2Heading"),
      body: t.rich("ex2Body", {
        clearing: formatEuros(clearingCents, locale),
        strong,
      }),
    });
  }
  steps.push({
    heading: t("ex3Heading"),
    body: (
      <>
        {t("ex3Body")}{" "}
        <Link
          href="/mecanisme"
          className="border-b border-champagne pb-px text-champagne-deep"
        >
          {t("ex3Link")}
        </Link>
      </>
    ),
  });

  return (
    <>
      <RevealHero
        tone="loss"
        eyebrow={t("heroEyebrow", { number: props.dropNumber, time: props.revealTime })}
        title={t("lostTitle")}
        sub={t("belowFloorSub")}
        meta={t("belowFloorMeta")}
      />

      <section className="mx-auto max-w-content border-y border-rule px-gutter py-14 md:py-20">
        <div className="mb-12 text-center text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("landedEyebrow")}
        </div>

        <div
          className="relative mx-auto max-w-[680px] py-14"
          aria-label={`${t("chartFloorThisDrop")} ${formatEuros(floorCents, locale)}, ${t("chartYourBid")} ${formatEuros(bidCents, locale)}`}
        >
          <div className="relative h-20 border-x border-rule">
            {/* Ligne de plancher (moitie droite) + embout carre */}
            <div className="absolute -right-2 left-1/2 top-1/2 h-px bg-foreground">
              <span
                aria-hidden
                className="absolute -right-px -top-[3px] h-2 w-2 bg-foreground"
              />
            </div>
            <div className="absolute -right-2 text-right" style={{ top: "calc(50% - 38px)" }}>
              <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("chartFloorThisDrop")}
              </div>
              <div className="font-serif text-2xl font-light italic tabular-nums tracking-[-0.012em] text-foreground">
                {formatEuros(floorCents, locale)}
              </div>
            </div>

            {/* Marqueur de l'offre (moitie gauche) + ligne descendante */}
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-champagne-deep bg-background"
              style={{ left: `${bidLeft}%` }}
            />
            <div
              aria-hidden
              className="absolute h-6 -translate-x-1/2 border-l border-dashed border-rule"
              style={{ left: `${bidLeft}%`, top: "calc(50% + 8px)" }}
            />
            <div
              className="absolute -translate-x-1/2 whitespace-nowrap text-center"
              style={{ left: `${bidLeft}%`, top: "calc(50% + 42px)" }}
            >
              <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-champagne-deep">
                {t("chartYourBid")}
              </div>
              <div className="font-serif text-2xl font-light italic tabular-nums tracking-[-0.012em] text-ink-2">
                {formatEuros(bidCents, locale)}
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-14 max-w-[580px] text-center text-[15px] leading-relaxed text-ink-2">
          {t.rich("belowFloorExplainer", {
            bid: formatEuros(bidCents, locale),
            strong,
          })}
        </p>
      </section>

      <NumberedSteps
        eyebrow={t("explainerEyebrow")}
        title={t("explainerTitle")}
        steps={steps}
        foot={t.rich("explainerFoot", {
          link: (c) => (
            <Link
              href="/lire/vickrey-tresor-clearing-price"
              className="border-b border-rule pb-px font-serif text-[15px] italic text-ink-2 hover:border-foreground hover:text-foreground"
            >
              {c}
            </Link>
          ),
        })}
      />

      <NextDropCard />
    </>
  );
}
