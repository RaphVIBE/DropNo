import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatDropNumber, formatEuros, formatRevealMoment } from "@/lib/format";
import { DropVisual } from "@/components/drop/drop-visual";
import { DropCountdown } from "@/components/drop/drop-countdown";
import { Masthead } from "@/components/brand/masthead";
import { CARD_CTA, PIECE_FRAME } from "@/components/brand/styles";
import type { CalendarDrop } from "@/components/drop/calendar-row";
import type { Locale } from "@/i18n/routing";

function Arrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block font-serif text-xl italic text-foreground">
        {value}
      </span>
    </div>
  );
}

/**
 * Hero de la home : le drop de la semaine EST le héros — visuel dominant + le
 * minimum vital (kicker de positionnement, maison, titre, plancher, compte à
 * rebours, CTA). Le mécanisme et le manifeste passent en second (acte 2).
 */
export async function HomeDropHero({
  drop,
  open,
  serverNowIso,
}: {
  drop: CalendarDrop;
  open: boolean;
  serverNowIso: string;
}) {
  const t = await getTranslations("home");
  const td = await getTranslations("drops");
  const locale = (await getLocale()) as Locale;

  const num = formatDropNumber(drop.drop_number ?? 0);
  const floor = drop.floor_price_cents
    ? formatEuros(drop.floor_price_cents, locale)
    : "—";
  const moment = drop.reveal_at
    ? formatRevealMoment(drop.reveal_at, locale)
    : "—";

  return (
    <Masthead variant="movement" padding="px-7 pb-16 pt-10 md:px-16 md:pb-20 md:pt-14">
      <Link
        href={drop.id ? `/drop/${drop.id}` : "#"}
        className="group grid grid-cols-1 gap-8 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background md:grid-cols-[0.9fr_1fr] md:items-center md:gap-16"
      >
        {/* La pièce — présente sans écraser le reste */}
        <div className={`relative mx-auto aspect-[5/6] w-full max-w-[28rem] overflow-hidden ${PIECE_FRAME} shadow-[0_28px_80px_-30px_oklch(0.2_0.02_60/0.6)] transition-shadow duration-500 group-hover:shadow-[0_38px_100px_-32px_oklch(0.2_0.02_60/0.72)]`}>
          <DropVisual
            dropNumber={drop.drop_number ?? 0}
            title={drop.title ?? ""}
            heroImageUrl={drop.hero_image_url}
          />
        </div>

        {/* Le strict nécessaire, à droite */}
        <div className="flex flex-col gap-6">
          <p className="eyebrow">{t("heroKicker", { num, moment })}</p>

          <div>
            {drop.brand ? (
              <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {drop.brand.name}
              </div>
            ) : null}
            <h1 className="font-display text-[clamp(2.4rem,5.5vw,4.5rem)] italic leading-[1.02] transition-colors group-hover:text-champagne-deep">
              {drop.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-start gap-x-12 gap-y-5">
            <Meta label={td("metaFloor")} value={floor} />
            <Meta label={td("metaReveal")} value={moment} />
          </div>

          {open && drop.reveal_at ? (
            <div className="text-[11px] uppercase tracking-[0.18em]">
              <span className="inline-flex items-center gap-3 text-champagne-deep">
                <span className="inline-flex items-center gap-2">
                  <span className="status-dot" aria-hidden />
                  {td("statusOpen")}
                </span>
                <span aria-hidden className="text-rule-soft">
                  /
                </span>
                <DropCountdown
                  targetIso={drop.reveal_at}
                  serverNowIso={serverNowIso}
                  className="text-[13px] normal-case tracking-normal text-ink-2"
                />
              </span>
            </div>
          ) : null}

          <span className={`mt-1 px-7 py-3.5 ${CARD_CTA}`}>
            {open ? td("ctaMakeOffer") : td("ctaDiscover")}
            <Arrow />
          </span>
        </div>
      </Link>
    </Masthead>
  );
}
