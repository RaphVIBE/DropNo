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

// Fleche -> qui glisse legerement au survol de la carte (group-hover).
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
      <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block font-serif text-xl italic text-foreground">
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
      className="group grid grid-cols-1 gap-6 rounded-sm border-b border-rule-soft py-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background md:grid-cols-[clamp(260px,30vw,340px)_1fr] md:items-center md:gap-12 md:py-12"
    >
      {/* Grand visuel — pleine largeur (mobile), carre imposant (desktop) */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[oklch(0.16_0.012_60)] shadow-[0_18px_50px_-24px_oklch(0.2_0.02_60/0.55)] ring-1 ring-rule-soft transition-shadow duration-500 group-hover:shadow-[0_26px_70px_-26px_oklch(0.2_0.02_60/0.7)]">
        <WatchArt
          seed={drop.drop_number ?? 0}
          className={`absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
            teaseLocked ? "scale-110 blur-[8px]" : ""
          }`}
        />

        {/* No. du drop sur un ribbon ink translucide — contraste garanti
            quelle que soit la palette du visuel (cadran clair ou sombre). */}
        <span className="absolute left-3 top-3 rounded-full bg-[oklch(0.16_0.012_60)]/72 px-3 py-1 font-serif text-sm italic text-[oklch(0.95_0.005_80)] shadow-sm ring-1 ring-[oklch(0.72_0.07_80)]/30 backdrop-blur-sm">
          No. {formatDropNumber(drop.drop_number ?? 0)}
        </span>

        {teaseLocked ? (
          <span
            className="absolute inset-0 flex items-center justify-center bg-[oklch(0.16_0.012_60)]/35"
            aria-label="Visuel devoile une semaine avant l'ouverture"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-[oklch(0.95_0.005_80)]"
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

      {/* Informations */}
      <div className="flex flex-col gap-5">
        <div>
          {drop.brand ? (
            <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {drop.brand.name}
            </div>
          ) : null}
          <h4 className="font-serif text-[clamp(1.9rem,4vw,2.6rem)] italic leading-[1.05] transition-colors group-hover:text-champagne-deep">
            {drop.title}
          </h4>
        </div>

        <div className="flex flex-wrap items-start gap-x-12 gap-y-5">
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
        </div>

        <div className="flex flex-col gap-4">
          {/* Ligne de statut. Pour un drop a venir, la date d'ouverture est
              deja affichee dans la colonne « Ouverture » : on ne la repete pas
              ici. Pour un drop passe, on montre la date de cloture (absente de
              la colonne « Prix unitaire »). */}
          {variant === "open" ? (
            <div className="text-[11px] uppercase tracking-[0.18em]">
              <span className="inline-flex items-center gap-3 text-champagne-deep">
                <span className="inline-flex items-center gap-2">
                  <span className="status-dot" aria-hidden />
                  Ouvert
                </span>
                {drop.reveal_at ? (
                  <>
                    <span aria-hidden className="text-rule-soft">
                      /
                    </span>
                    <DropCountdown
                      targetIso={drop.reveal_at}
                      serverNowIso={serverNowIso}
                      className="text-[13px] normal-case tracking-normal text-ink-2"
                    />
                  </>
                ) : null}
              </span>
            </div>
          ) : variant === "past" ? (
            <div className="text-[11px] uppercase tracking-[0.18em]">
              <span className="text-muted-foreground">
                {drop.revealed_at
                  ? formatShortDate(drop.revealed_at)
                  : drop.reveal_at
                    ? formatShortDate(drop.reveal_at)
                    : ""}
              </span>
            </div>
          ) : null}

          {/* Appel a l'action. Visuel uniquement (la carte entiere est deja un
              lien) : bouton primaire affirme pour un drop ouvert, lien discret
              avec fleche pour les autres etats. */}
          {variant === "open" ? (
            <span className="mt-1 inline-flex w-fit items-center gap-2 bg-primary px-6 py-3 text-xs font-medium uppercase tracking-wider text-primary-foreground transition-colors group-hover:bg-[oklch(0.12_0.012_60)]">
              Faire une offre
              <Arrow />
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-ink-2 transition-colors group-hover:text-foreground">
              {variant === "upcoming" ? "Découvrir le drop" : "Voir le résultat"}
              <Arrow />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
