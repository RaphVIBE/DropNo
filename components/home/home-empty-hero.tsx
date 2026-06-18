import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Masthead } from "@/components/brand/masthead";
import { formatEuros } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type { CalendarDrop } from "@/components/drop/calendar-row";

/**
 * Héros de la home quand aucun drop n'est ouvert ni annoncé. On ne quémande
 * pas d'email (la liste vit déjà dans le footer) : on vend l'idée et le rituel.
 * Une ligne de preuve discrète rappelle le dernier prix unique atteint, s'il
 * existe, pour montrer que le rendez-vous est réel.
 */
export async function HomeEmptyHero({
  lastDrop,
}: {
  lastDrop: CalendarDrop | null;
}) {
  const t = await getTranslations("home");
  const locale = (await getLocale()) as Locale;

  return (
    <Masthead
      variant="escapement"
      padding="px-7 pb-20 pt-24 md:px-16 md:pb-28 md:pt-36"
    >
      <div className="max-w-3xl">
        <p
          className="eyebrow reveal"
          style={{ "--reveal-delay": "0ms" } as React.CSSProperties}
        >
          {t("emptyKicker")}
        </p>
        <h1
          className="font-display reveal mt-3 text-balance text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95]"
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
        >
          {t("emptyTitle")}
        </h1>
        <p
          className="reveal mt-7 max-w-[46ch] text-lg leading-relaxed text-ink-2"
          style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
        >
          {t("emptySub")}
        </p>
        <div
          className="reveal mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"
          style={{ "--reveal-delay": "360ms" } as React.CSSProperties}
        >
          <Button asChild size="lg">
            <Link href="/mecanisme">{t("ctaMechanism")}</Link>
          </Button>
          <Link
            href="/drops"
            className="rounded-sm text-[13px] text-ink-2 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("allCalendar")}
          </Link>
        </div>

        {lastDrop && lastDrop.clearing_price_cents ? (
          <p
            className="reveal mt-14 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-rule-soft pt-5"
            style={{ "--reveal-delay": "480ms" } as React.CSSProperties}
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("lastDrop")}
            </span>
            <span className="font-serif italic text-ink-2">{lastDrop.title}</span>
            {lastDrop.brand ? (
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {lastDrop.brand.name}
              </span>
            ) : null}
            <span className="font-serif italic text-champagne-deep">
              {formatEuros(lastDrop.clearing_price_cents, locale)}
            </span>
          </p>
        ) : null}
      </div>
    </Masthead>
  );
}
