import Link from "next/link";

import {
  formatDropNumber,
  formatEuros,
  formatRevealMoment,
  formatShortDate,
} from "@/lib/format";
import { DropCountdown } from "@/components/drop/drop-countdown";
import { WatchArt } from "@/components/drop/watch-art";

// Au-dela de ce delai avant l'ouverture, le visuel d'un drop a venir reste
// floute (on ne devoile pas la piece trop tot).
const TEASE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type CalendarDrop = {
  id: string | null;
  drop_number: number | null;
  title: string | null;
  status: string | null;
  floor_price_cents: number | null;
  clearing_price_cents: number | null;
  reveal_at: string | null;
  bid_window_opens_at: string | null;
  revealed_at: string | null;
  brand: { name: string; slug: string } | null;
};

type Variant = "open" | "upcoming" | "past";

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="cal-meta">
      <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="block font-serif text-lg italic text-foreground">
        {value}
      </span>
    </div>
  );
}

export function CalendarRow({
  drop,
  variant,
  serverNowIso,
}: {
  drop: CalendarDrop;
  variant: Variant;
  serverNowIso: string;
}) {
  const floor = drop.floor_price_cents
    ? formatEuros(drop.floor_price_cents)
    : "—";

  // On floute la vignette d'un drop a venir tant que l'ouverture est a plus
  // d'une semaine, pour ne pas devoiler la piece trop tot.
  const teaseLocked =
    variant === "upcoming" && drop.bid_window_opens_at
      ? new Date(drop.bid_window_opens_at).getTime() -
          new Date(serverNowIso).getTime() >
        TEASE_WINDOW_MS
      : false;

  return (
    <Link
      href={drop.id ? `/drop/${drop.id}` : "#"}
      className="grid grid-cols-1 gap-3 border-b border-rule-soft py-7 transition-colors hover:bg-card md:grid-cols-[150px_1.4fr_1fr_1fr_120px] md:items-center md:gap-8 md:px-2 md:py-8"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md ring-1 ring-rule-soft">
          <WatchArt
            seed={drop.drop_number ?? 0}
            className={`absolute inset-0 h-full w-full ${
              teaseLocked ? "scale-110 blur-[5px]" : ""
            }`}
          />
          {teaseLocked ? (
            <span
              className="absolute inset-0 flex items-center justify-center bg-[oklch(0.16_0.012_60)]/35"
              aria-label="Visuel devoile une semaine avant l'ouverture"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-[oklch(0.95_0.005_80)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
          ) : null}
        </div>
        <span className="font-serif text-[22px] italic text-ink-2">
          No. {formatDropNumber(drop.drop_number ?? 0)}
        </span>
      </div>

      <div>
        <h4 className="font-serif text-[26px] italic leading-tight">
          {drop.title}
        </h4>
        {drop.brand ? (
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {drop.brand.name}
          </div>
        ) : null}
      </div>

      <Meta label="Plancher" value={floor} />

      {variant === "open" ? (
        <Meta
          label="Révélation"
          value={drop.reveal_at ? formatRevealMoment(drop.reveal_at) : "—"}
        />
      ) : variant === "upcoming" ? (
        <Meta
          label="Ouverture"
          value={
            drop.bid_window_opens_at
              ? formatShortDate(drop.bid_window_opens_at)
              : "—"
          }
        />
      ) : (
        <Meta
          label="Prix unitaire"
          value={
            drop.clearing_price_cents
              ? formatEuros(drop.clearing_price_cents)
              : "Annulé"
          }
        />
      )}

      <div className="text-left text-[11px] uppercase tracking-[0.18em] md:text-right">
        {variant === "open" ? (
          <span className="inline-flex flex-col gap-1 text-champagne-deep md:items-end">
            <span className="inline-flex items-center gap-2">
              <span className="status-dot" aria-hidden />
              Ouvert
            </span>
            {drop.reveal_at ? (
              <DropCountdown
                targetIso={drop.reveal_at}
                serverNowIso={serverNowIso}
                className="text-[13px] normal-case tracking-normal text-ink-2"
              />
            ) : null}
          </span>
        ) : variant === "upcoming" ? (
          <span className="text-ink-2">
            {drop.bid_window_opens_at
              ? formatShortDate(drop.bid_window_opens_at)
              : "Bientôt"}
          </span>
        ) : (
          <span className="text-muted-foreground">
            {drop.revealed_at
              ? formatShortDate(drop.revealed_at)
              : drop.reveal_at
                ? formatShortDate(drop.reveal_at)
                : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
