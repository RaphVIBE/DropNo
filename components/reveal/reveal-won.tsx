import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatEuros } from "@/lib/format";
import {
  BigPrice,
  NumberedSteps,
  RevealHero,
  btnSolid,
} from "@/components/reveal/shared";

/*
 * Ecran gagnant. Couvre `won` (rangs 2..N) et `won_privilege` (top bidder) :
 * le privilege n'ajoute qu'un encart « offre privee » entre la piece et la
 * suite des etapes (cf. dropno-buyer-reveal-winner.html / -reveal-privilege.html).
 */

export type RevealWonProps = {
  locale: string;
  dropNumber: number;
  revealTime: string;
  count: number;
  clearingCents: number;
  bidCents: number;
  brand: string | null;
  pieceTitle: string;
  specs: { label: string; value: string }[];
  order: {
    ref: string;
    dropTitle: string;
    capturedAtLabel: string | null;
    amountCents: number | null;
  } | null;
  email: string;
  // Le teaser ne devoile NI le supplement NI le numero : ils restent caches
  // jusqu'a la page de l'offre. On ne passe donc que le compte a rebours + le lien.
  privilege: {
    remaining: string;
    href: string;
  } | null;
};

export async function RevealWon(props: RevealWonProps) {
  const t = await getTranslations("reveal");
  const { locale, clearingCents, bidCents } = props;
  const saved = bidCents - clearingCents;

  return (
    <>
      <RevealHero
        tone="win"
        eyebrow={t("heroEyebrow", { number: props.dropNumber, time: props.revealTime })}
        title={t("wonTitle")}
        sub={t("wonSub", { count: props.count })}
      />

      {/* Clearing */}
      <section className="mx-auto max-w-content border-y border-rule px-gutter py-14 text-center md:py-20">
        <div className="mb-[22px] text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("clearingLabel")}
        </div>
        <BigPrice cents={clearingCents} locale={locale} />
        <div className="text-sm text-muted-foreground">
          {t("clearingFoot", { count: props.count })}
        </div>
      </section>

      {/* Votre offre vs clearing */}
      <section className="mx-auto max-w-[880px] px-gutter py-16 text-center md:py-24">
        <div className="mb-[22px] text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("bidCompareEyebrow")}
        </div>
        <h2 className="mb-12 font-serif text-[clamp(32px,4.4vw,48px)] font-light italic leading-tight tracking-[-0.02em]">
          {t("bidCompareTitle", {
            bid: formatEuros(bidCents, locale),
            clearing: formatEuros(clearingCents, locale),
          })}
        </h2>
        <div className="mb-9 flex flex-wrap items-center justify-center gap-6 md:gap-12">
          <div className="min-w-[160px]">
            <div className="mb-2.5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("bidCompareYourBid")}
            </div>
            <div className="font-serif text-[clamp(40px,5vw,56px)] font-light italic leading-none tabular-nums text-muted-foreground line-through decoration-muted-2 decoration-1">
              {formatEuros(bidCents, locale)}
            </div>
          </div>
          <div className="font-serif text-4xl italic text-muted-2 max-md:rotate-90">
            →
          </div>
          <div className="min-w-[160px]">
            <div className="mb-2.5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("bidComparePay")}
            </div>
            <div className="font-serif text-[clamp(40px,5vw,56px)] font-light italic leading-none tabular-nums text-champagne-deep">
              {formatEuros(clearingCents, locale)}
            </div>
          </div>
        </div>
        {saved > 0 ? (
          <p className="mx-auto max-w-[580px] text-[15px] leading-relaxed text-ink-2">
            {t.rich("bidCompareExplainer", {
              count: props.count,
              saved: formatEuros(saved, locale),
              amt: (c) => (
                <span className="font-serif italic tabular-nums text-champagne-deep">
                  {c}
                </span>
              ),
            })}
          </p>
        ) : null}
      </section>

      {/* Piece */}
      <section className="mx-auto grid max-w-content grid-cols-1 items-center gap-8 px-gutter py-14 md:grid-cols-2 md:gap-20 md:py-20">
        <div className="flex aspect-square items-center justify-center border border-rule bg-bg-deep font-serif text-sm italic text-muted-2">
          {props.pieceTitle}
        </div>
        <div>
          <div className="mb-[18px] text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            {t("pieceLabel")}
          </div>
          <h2 className="mb-3.5 font-serif text-[clamp(32px,4.5vw,48px)] font-light italic leading-[1.05] tracking-[-0.02em]">
            {props.pieceTitle}
          </h2>
          {props.brand ? (
            <p className="mb-8 text-[15px] text-muted-foreground">
              {t("pieceHouse", { brand: props.brand })}
            </p>
          ) : null}
          {props.specs.length > 0 ? (
            <ul className="border-t border-rule-soft">
              {props.specs.map((s) => (
                <li
                  key={s.label}
                  className="flex justify-between border-b border-rule-soft py-3.5 text-sm"
                >
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="tabular-nums text-foreground">{s.value}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {/* Privilege № 001 (top bidder uniquement) */}
      {props.privilege ? (
        <section className="relative border-y border-rule-soft bg-bg-deep px-gutter py-20 text-center md:py-[120px]">
          <span
            aria-hidden
            className="absolute left-1/2 top-7 h-px w-16 -translate-x-1/2 bg-champagne-deep md:top-12"
          />
          <span
            aria-hidden
            className="absolute bottom-7 left-1/2 h-px w-16 -translate-x-1/2 bg-champagne-deep md:bottom-12"
          />
          <div className="mx-auto max-w-[760px]">
            <div className="mb-9 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-champagne-deep">
              <span aria-hidden className="h-1 w-1 rotate-45 bg-champagne-deep" />
              {t("privEyebrow")}
              <span aria-hidden className="h-1 w-1 rotate-45 bg-champagne-deep" />
            </div>
            <h2 className="mb-6 font-serif text-[clamp(36px,5.2vw,60px)] font-light italic leading-tight tracking-[-0.025em]">
              {t("privTitle")}
            </h2>
            <p className="mx-auto mb-11 max-w-[540px] font-serif text-[clamp(16px,1.8vw,19px)] italic leading-relaxed text-ink-2">
              {t("privSub")}
            </p>
            <Link
              href={props.privilege.href}
              className="inline-flex items-center gap-3.5 border border-foreground bg-foreground px-9 py-5 text-xs font-medium uppercase tracking-[0.22em] text-background transition-all duration-200 ease-quart hover:-translate-y-px hover:border-champagne-deep hover:bg-champagne-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("privCta")}
              <span aria-hidden className="font-serif text-lg italic">
                →
              </span>
            </Link>
            <div className="mt-6 text-xs text-muted-foreground">
              {t.rich("privWindow", {
                remaining: props.privilege.remaining,
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Ce qui se passe ensuite */}
      <NumberedSteps
        eyebrow={t("nextStepsEyebrow")}
        title={t("nextStepsTitle")}
        steps={[
          {
            heading: t("step1Heading", {
              amount: formatEuros(clearingCents, locale),
            }),
            body: props.privilege ? t("step1BodyPrivilege") : t("step1Body"),
          },
          { heading: t("step2Heading"), body: t("step2Body") },
          {
            heading: t("step3Heading"),
            body: (
              <>
                {t("step3Body")}{" "}
                <Link
                  href="/retractation"
                  className="border-b border-champagne pb-px text-champagne-deep"
                >
                  {t("step3Link")}
                </Link>
              </>
            ),
          },
        ]}
      />

      {/* Details de la commande */}
      {props.order ? (
        <section className="mx-auto max-w-[880px] border-t border-rule px-gutter pb-20 pt-14 md:pb-24 md:pt-16">
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3.5">
            <h3 className="font-serif text-[28px] font-light italic tracking-[-0.012em]">
              {t("orderTitle")}
            </h3>
          </div>
          <OrderRow label={t("orderNumber")} value={props.order.ref} variant="it" />
          <OrderRow
            label={t("orderDrop")}
            value={t("orderDropValue", {
              number: props.dropNumber,
              title: props.order.dropTitle,
            })}
          />
          {props.order.capturedAtLabel ? (
            <OrderRow
              label={t("orderCapturedAt")}
              value={props.order.capturedAtLabel}
            />
          ) : null}
          {props.order.amountCents != null ? (
            <OrderRow
              label={t("orderAmount")}
              value={formatEuros(props.order.amountCents, locale)}
              variant="it"
            />
          ) : null}
          <p className="mt-7 text-center text-[13px] leading-relaxed text-muted-foreground">
            {t("orderFoot", { email: props.email })}
            <br />
            {t.rich("orderFootHelp", {
              link: (c) => (
                <a
                  href="mailto:hello@dropno.eu"
                  className="border-b border-rule pb-px text-ink-2"
                >
                  {c}
                </a>
              ),
            })}
          </p>
        </section>
      ) : null}

      {/* Filet de raccord vers le calendrier, discret apres une victoire. */}
      <div className="px-gutter pb-16 text-center">
        <Link href="/drops" className={btnSolid}>
          {t("nextDropCalendar")}
        </Link>
      </div>
    </>
  );
}

function OrderRow({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "it" | "mono";
}) {
  const v =
    variant === "it"
      ? "font-serif text-base italic"
      : variant === "mono"
        ? "font-mono text-[13px] text-ink-2"
        : "";
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule-soft py-3.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right tabular-nums text-foreground ${v}`}>
        {value}
      </span>
    </div>
  );
}
