import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { CalendarRow, type CalendarDrop } from "@/components/drop/calendar-row";
import { UpcomingCard } from "@/components/drop/upcoming-card";
import { formatDropNumber, formatEuros, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const SELECT =
  "id, drop_number, title, status, floor_price_cents, clearing_price_cents, reveal_at, bid_window_opens_at, revealed_at, brand:brands(name, slug)";

function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

// Drop Calendar (route /drops) — hiérarchie : En cours (pleine largeur),
// À venir (grille 2 colonnes), Passés (volet replié, discret).
export default async function DropsPage() {
  const supabase = createClient();
  const serverNowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("drops_public")
    .select(SELECT)
    .order("reveal_at", { ascending: true });

  const drops = (data ?? []) as unknown as CalendarDrop[];

  const open = drops
    .filter((d) => d.status === "open")
    .sort((a, b) => (a.reveal_at ?? "").localeCompare(b.reveal_at ?? ""));

  const upcoming = drops
    .filter((d) => d.status === "scheduled")
    .sort((a, b) =>
      (a.bid_window_opens_at ?? "").localeCompare(b.bid_window_opens_at ?? "")
    );

  const past = drops
    .filter((d) => ["revealed", "closed", "cancelled"].includes(d.status ?? ""))
    .sort((a, b) =>
      (b.revealed_at ?? b.reveal_at ?? "").localeCompare(
        a.revealed_at ?? a.reveal_at ?? ""
      )
    );

  return (
    <>
      <div className="px-7 pt-24 md:px-16 md:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-2 border-b border-rule-soft pb-5">
          <div>
            <span className="eyebrow">Calendrier</span>
            <h1 className="font-display mt-1.5 text-[clamp(1.9rem,4vw,2.75rem)] leading-none">
              Les drops
            </h1>
          </div>
          <p className="max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
            Offres scellées jusqu&apos;à la révélation. Tous les gagnants payent
            le même prix : la dernière offre retenue.
          </p>
        </div>
      </div>

      {error ? (
        <p className="px-7 py-16 text-destructive md:px-16">
          Impossible de charger les drops pour le moment.
        </p>
      ) : (
        <>
          {/* ── En cours : pleine largeur, prioritaire ── */}
          <section className="px-7 pt-12 md:px-16 md:pt-14">
            <div className="mb-6 flex items-baseline justify-between border-b border-foreground pb-5">
              <h2 className="font-serif text-4xl italic">En cours</h2>
              <span className="text-[13px] tracking-wide text-muted-foreground">
                {plural(open.length, "drop ouvert", "drops ouverts")}
              </span>
            </div>
            {open.length === 0 ? (
              <p className="py-6 text-ink-2">
                Aucun drop ouvert en ce moment. Le prochain est juste en dessous.
              </p>
            ) : (
              open.map((drop) => (
                <CalendarRow key={drop.id} drop={drop} variant="open" serverNowIso={serverNowIso} />
              ))
            )}
          </section>

          {/* ── À venir : grille 2 colonnes ── */}
          <section className="px-7 pt-16 md:px-16 md:pt-20">
            <div className="mb-2 flex items-baseline justify-between border-b border-rule pb-5">
              <h3 className="font-serif text-2xl italic">À venir</h3>
              <span className="text-[13px] tracking-wide text-muted-foreground">
                {plural(upcoming.length, "drop planifié", "drops planifiés")}
              </span>
            </div>
            {upcoming.length === 0 ? (
              <p className="py-6 text-ink-2">Aucun drop planifié pour l&apos;instant.</p>
            ) : (
              <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
                {upcoming.map((drop) => (
                  <UpcomingCard key={drop.id} drop={drop} serverNowIso={serverNowIso} />
                ))}
              </div>
            )}
          </section>

          {/* ── Passés : volet replié, discret ── */}
          {past.length > 0 ? (
            <section className="px-7 pb-28 pt-16 md:px-16 md:pt-20">
              <details className="group border-t border-rule pt-5">
                <summary className="flex cursor-pointer list-none items-baseline justify-between rounded-sm py-2.5 [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span className="flex items-baseline gap-3">
                    <h3 className="font-serif text-2xl italic text-ink-2 transition-colors group-hover:text-foreground">Passés</h3>
                    <span className="text-[13px] text-muted-foreground">{plural(past.length, "drop clôturé", "drops clôturés")}</span>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors group-hover:text-foreground">
                    <span className="group-open:hidden">Afficher</span>
                    <span className="hidden group-open:inline">Masquer</span>
                  </span>
                </summary>
                <ul className="mt-4">
                  {past.map((drop) => (
                    <li key={drop.id} className="border-b border-rule-soft last:border-0">
                      <Link href={drop.id ? `/drop/${drop.id}` : "#"} className="group/row flex items-baseline justify-between gap-6 rounded-sm py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                        <span className="flex min-w-0 items-baseline gap-5">
                          <span className="shrink-0 font-serif text-sm italic tabular-nums text-muted-foreground">No. {formatDropNumber(drop.drop_number ?? 0)}</span>
                          <span className="truncate">
                            <span className="font-serif text-lg italic transition-colors group-hover/row:text-champagne-deep">{drop.title}</span>
                            {drop.brand ? <span className="ml-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{drop.brand.name}</span> : null}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {drop.clearing_price_cents ? formatEuros(drop.clearing_price_cents) : "Annulé"}
                          {drop.revealed_at || drop.reveal_at ? ` · ${formatShortDate((drop.revealed_at ?? drop.reveal_at) as string)}` : ""}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
