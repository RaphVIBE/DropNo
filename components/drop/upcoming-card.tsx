import Link from "next/link";

import { formatEuros, formatShortDate } from "@/lib/format";
import { DropVisual } from "@/components/drop/drop-visual";
import type { CalendarDrop } from "@/components/drop/calendar-row";

// Au-delà de ce délai avant l'ouverture, le visuel reste flouté (on ne dévoile
// pas la pièce trop tôt) — donne la hiérarchie « bientôt visible » vs « pas
// encore présentée » dans la grille À venir.
const TEASE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** Carte compacte d'un drop à venir, pensée pour une grille 2 colonnes. */
export function UpcomingCard({
  drop,
  serverNowIso,
}: {
  drop: CalendarDrop;
  serverNowIso: string;
}) {
  const teaseLocked = drop.bid_window_opens_at
    ? new Date(drop.bid_window_opens_at).getTime() - new Date(serverNowIso).getTime() > TEASE_WINDOW_MS
    : false;

  return (
    <Link
      href={drop.id ? `/drop/${drop.id}` : "#"}
      className="group flex flex-col gap-5 rounded-sm border-t border-rule-soft py-7 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-row sm:items-center sm:gap-7"
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden rounded-xl bg-[oklch(0.16_0.012_60)] ring-1 ring-rule-soft sm:w-44 sm:shrink-0">
        <DropVisual
          dropNumber={drop.drop_number ?? 0}
          title={drop.title ?? ""}
          heroImageUrl={drop.hero_image_url}
          teaseLocked={teaseLocked}
          compact
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {drop.brand ? (
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{drop.brand.name}</div>
        ) : null}
        <h4 className="font-serif text-[26px] italic leading-tight transition-colors group-hover:text-champagne-deep">
          {drop.title}
        </h4>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Plancher</span>
            <span className="mt-0.5 block font-serif text-lg italic text-foreground">{drop.floor_price_cents ? formatEuros(drop.floor_price_cents) : "—"}</span>
          </div>
          <div>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Ouverture</span>
            <span className="mt-0.5 block font-serif text-lg italic text-foreground">{drop.bid_window_opens_at ? formatShortDate(drop.bid_window_opens_at) : "—"}</span>
          </div>
        </div>
        <span className="mt-1 inline-flex w-fit items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-ink-2 transition-colors group-hover:text-foreground">
          {teaseLocked ? "Bientôt dévoilé" : "Découvrir le drop"}
          <Arrow />
        </span>
      </div>
    </Link>
  );
}
