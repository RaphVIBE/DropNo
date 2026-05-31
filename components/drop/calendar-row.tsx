import Link from "next/link";

import {
  formatDropNumber,
  formatEuros,
  formatRevealMoment,
  formatShortDate,
} from "@/lib/format";
import { DropCountdown } from "@/components/drop/drop-countdown";

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

  return (
    <Link
      href={drop.id ? `/drop/${drop.id}` : "#"}
      className="grid grid-cols-1 gap-3 border-b border-rule-soft py-7 transition-colors hover:bg-card md:grid-cols-[120px_1.4fr_1fr_1fr_120px] md:items-center md:gap-8 md:px-2 md:py-8"
    >
      <div className="font-serif text-[22px] italic text-ink-2">
        No. {formatDropNumber(drop.drop_number ?? 0)}
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
