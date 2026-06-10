import Link from "next/link";

import { formatDropNumber, formatEuros, formatShortDate } from "@/lib/format";
import { WatchArt } from "@/components/drop/watch-art";
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
        <WatchArt
          seed={drop.drop_number ?? 0}
          className={`absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04] ${teaseLocked ? "scale-110 blur-[8px]" : ""}`}
        />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-[oklch(0.16_0.012_60)]/72 px-2.5 py-0.5 font-serif text-xs italic text-[oklch(0.95_0.005_80)] ring-1 ring-[oklch(0.72_0.07_80)]/30 backdrop-blur-sm">
          No. {formatDropNumber(drop.drop_number ?? 0)}
        </span>
        {teaseLocked ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[oklch(0.16_0.012_60)]/35" aria-label="Visuel dévoilé une semaine avant l'ouverture">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[oklch(0.95_0.005_80)]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
        ) : null}
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
            <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Plancher</span>
            <span className="mt-0.5 block font-serif text-lg italic text-foreground">{drop.floor_price_cents ? formatEuros(drop.floor_price_cents) : "—"}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ouverture</span>
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
