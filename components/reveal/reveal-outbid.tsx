import { getTranslations } from "next-intl/server";

import { formatEuros } from "@/lib/format";
import { NextDropCard, RevealHero } from "@/components/reveal/shared";

/*
 * Ecran « offre au-dessus du plancher mais sous le clearing » (outbid).
 * Graphe a 3 points : plancher, votre offre, clearing. Les positions sont
 * calculees a partir des vraies valeurs (cf. dropno-buyer-reveal-outbid.html).
 */

export type RevealOutbidProps = {
  locale: string;
  dropNumber: number;
  revealTime: string;
  count: number;
  clearingCents: number;
  bidCents: number;
  floorCents: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export async function RevealOutbid(props: RevealOutbidProps) {
  const t = await getTranslations("reveal");
  const { locale, clearingCents, bidCents, floorCents } = props;
  const short = clearingCents - bidCents;

  // Domaine : un peu sous le plancher, un peu au-dessus du clearing. Positions
  // bornees a [8%, 92%] pour ne pas coller aux bords.
  const span = Math.max(clearingCents - floorCents, 1);
  const min = floorCents - span * 0.3;
  const max = clearingCents + span * 0.25;
  const pos = (x: number) => clamp(((x - min) / (max - min)) * 100, 8, 92);
  const floorPct = pos(floorCents);
  const bidPct = pos(bidCents);
  const clearingPct = pos(clearingCents);

  return (
    <>
      <RevealHero
        tone="loss"
        eyebrow={t("heroEyebrow", { number: props.dropNumber, time: props.revealTime })}
        title={t("lostTitle")}
        sub={t("outbidSub")}
        meta={t("outbidMeta")}
      />

      <section className="mx-auto max-w-content border-y border-rule px-gutter py-14 md:py-20">
        <div className="mb-14 text-center text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("landedEyebrow")}
        </div>

        <div
          className="relative mx-auto max-w-[760px] px-2 py-14"
          aria-label={`${t("chartFloor")} ${formatEuros(floorCents, locale)}, ${t("chartYourBid")} ${formatEuros(bidCents, locale)}, ${t("chartClearing")} ${formatEuros(clearingCents, locale)}`}
        >
          <div className="relative h-20 border-t border-rule">
            <ChartMarker
              leftPct={floorPct}
              kind="floor"
              labelPos="below"
              label={t("chartFloor")}
              value={formatEuros(floorCents, locale)}
            />
            <ChartMarker
              leftPct={bidPct}
              kind="bid"
              labelPos="above"
              label={t("chartYourBid")}
              value={formatEuros(bidCents, locale)}
            />
            <ChartMarker
              leftPct={clearingPct}
              kind="clearing"
              labelPos="below"
              label={t("chartClearing")}
              value={formatEuros(clearingCents, locale)}
            />
          </div>
        </div>

        <p className="mx-auto mt-16 max-w-[580px] text-center text-[15px] leading-relaxed text-ink-2">
          {t.rich("outbidExplainer", {
            count: props.count,
            clearing: formatEuros(clearingCents, locale),
            short: formatEuros(short, locale),
            strong: (c) => <strong className="font-medium text-foreground">{c}</strong>,
          })}
        </p>
      </section>

      <NextDropCard />
    </>
  );
}

function ChartMarker({
  leftPct,
  kind,
  labelPos,
  label,
  value,
}: {
  leftPct: number;
  kind: "floor" | "bid" | "clearing";
  labelPos: "above" | "below";
  label: string;
  value: string;
}) {
  const dot =
    kind === "clearing"
      ? "border-foreground bg-foreground"
      : kind === "bid"
        ? "border-champagne-deep bg-background"
        : "border-muted-foreground bg-background";
  return (
    <>
      <div
        className="absolute -top-[7px] -translate-x-1/2"
        style={{ left: `${leftPct}%` }}
      >
        <div className={`h-3.5 w-3.5 rounded-full border-2 ${dot}`} />
      </div>
      <div
        aria-hidden
        className="absolute -bottom-2.5 top-0 border-l border-dashed border-rule"
        style={{ left: `${leftPct}%` }}
      />
      <div
        className={`absolute -translate-x-1/2 whitespace-nowrap text-center ${
          labelPos === "above" ? "-top-[68px]" : "top-6"
        }`}
        style={{ left: `${leftPct}%` }}
      >
        <div
          className={`mb-1.5 text-[10px] uppercase tracking-[0.22em] ${
            kind === "bid" ? "text-champagne-deep" : "text-muted-foreground"
          }`}
        >
          {label}
        </div>
        <div
          className={`font-serif text-[22px] font-light italic tabular-nums tracking-[-0.012em] ${
            kind === "bid" ? "text-ink-2" : "text-foreground"
          }`}
        >
          {value}
        </div>
      </div>
    </>
  );
}
