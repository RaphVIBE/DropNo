import { getLocale, getTranslations } from "next-intl/server";

import { formatShortDate } from "@/lib/format";
import { DropVisual } from "@/components/drop/drop-visual";
import { PIECE_FRAME } from "@/components/brand/styles";
import type { CalendarDrop } from "@/components/drop/calendar-row";
import type { Locale } from "@/i18n/routing";

/**
 * Carte « Avant-première » réservée à la Liste : teaser volontairement sobre —
 * visuel verrouillé + maison + titre + date d'ouverture. Pas de plancher ni de
 * photo : la fiche complète se dévoile à l'annonce publique. Non cliquable (le
 * drop n'est pas encore ouvert au public).
 */
export async function PreviewCard({ drop }: { drop: CalendarDrop }) {
  const t = await getTranslations("drops");
  const locale = (await getLocale()) as Locale;

  return (
    <div className="flex flex-col gap-5 border-t border-rule-soft py-7 sm:flex-row sm:items-center sm:gap-7">
      <div className={`relative aspect-[5/4] w-full overflow-hidden ${PIECE_FRAME} sm:w-44 sm:shrink-0`}>
        <DropVisual
          dropNumber={drop.drop_number ?? 0}
          title={drop.title ?? ""}
          teaseLocked
          compact
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-champagne-deep">
          <span className="status-dot" aria-hidden />
          {t("previewBadge")}
        </span>
        {drop.brand ? (
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {drop.brand.name}
          </div>
        ) : null}
        <h4 className="font-serif text-[26px] italic leading-tight">{drop.title}</h4>
        <div>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("metaOpening")}
          </span>
          <span className="mt-0.5 block font-serif text-lg italic text-foreground">
            {drop.bid_window_opens_at
              ? formatShortDate(drop.bid_window_opens_at, locale)
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
