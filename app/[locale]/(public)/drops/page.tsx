import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/brand/masthead";
import { CalendarRow, type CalendarDrop } from "@/components/drop/calendar-row";
import { UpcomingCard } from "@/components/drop/upcoming-card";
import { PreviewCard } from "@/components/drop/preview-card";
import { isAnnounced, isInPreview } from "@/lib/admin/drops";
import { formatDropNumber, formatEuros, formatShortDate } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/i18n/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("drops");
  return {
    alternates: localizedAlternates("/drops", await getLocale()),
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const SELECT =
  "id, drop_number, title, status, floor_price_cents, clearing_price_cents, reveal_at, bid_window_opens_at, revealed_at, format, hero_image_url, brand:brands(name, slug)";

// Drop Calendar (route /drops) — hiérarchie : En cours (pleine largeur),
// À venir (grille 2 colonnes), Passés (volet replié, discret).
export default async function DropsPage() {
  const t = await getTranslations("drops");
  const locale = (await getLocale()) as Locale;
  const supabase = createClient();
  const serverNowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("drops_public")
    .select(SELECT)
    .eq("is_demo", false) // les drops démo prospects ne sont jamais listés
    .order("reveal_at", { ascending: true });

  const drops = (data ?? []) as unknown as CalendarDrop[];

  const open = drops
    .filter((d) => d.status === "open")
    .sort((a, b) => (a.reveal_at ?? "").localeCompare(b.reveal_at ?? ""));

  // Un drop programmé n'apparaît « À venir » qu'à partir de sa date d'annonce
  // (ouverture − lead du format) — on ne dévoile pas le calendrier trop tôt.
  const upcoming = drops
    .filter(
      (d) => d.status === "scheduled" && isAnnounced(d.bid_window_opens_at, d.format, serverNowIso)
    )
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

  // Avant-première : réservé à la Liste (membres waitlist), drops programmés
  // dans la fenêtre de preview, avant l'annonce publique. Gating serveur via
  // la RPC am_i_on_the_list() (ne révèle qu'un booléen sur l'email en session).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let onList = false;
  if (user) {
    const { data: member } = await supabase.rpc("am_i_on_the_list");
    onList = member === true;
  }
  const preview = onList
    ? drops
        .filter(
          (d) =>
            d.status === "scheduled" &&
            isInPreview(d.bid_window_opens_at, d.format, serverNowIso)
        )
        .sort((a, b) =>
          (a.bid_window_opens_at ?? "").localeCompare(b.bid_window_opens_at ?? "")
        )
    : [];

  return (
    <>
      <Masthead variant="escapement" padding="px-7 pb-9 pt-20 md:px-16 md:pb-11 md:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="font-display mt-1.5 text-[clamp(2.1rem,4.5vw,3.25rem)] leading-none">
              {t("title")}
            </h1>
          </div>
          <p className="max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
            {t("intro")}
          </p>
        </div>
      </Masthead>

      {error ? (
        <p className="px-7 py-16 text-destructive md:px-16">
          {t("loadError")}
        </p>
      ) : (
        <>
          {/* ── Avant-première : la Liste uniquement, teaser sobre. En tête. ── */}
          {preview.length > 0 ? (
            <section className="border-b border-rule-soft bg-sand px-7 pb-12 pt-12 md:px-16 md:pb-14 md:pt-14">
              <div className="mb-2 flex flex-wrap items-end justify-between gap-x-10 gap-y-2 border-b border-champagne-deep pb-5">
                <div>
                  <span className="eyebrow text-champagne-deep">{t("previewHeading")}</span>
                  <p className="mt-1 max-w-[48ch] text-sm leading-relaxed text-ink-2">
                    {t("previewLead")}
                  </p>
                </div>
                <span className="text-[13px] tracking-wide text-muted-foreground">
                  {t("previewCount", { count: preview.length })}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
                {preview.map((drop) => (
                  <PreviewCard key={drop.id} drop={drop} />
                ))}
              </div>
            </section>
          ) : null}

          {/* ── En cours : pleine largeur, prioritaire. Masquée s'il n'y a
              aucun drop ouvert — « À venir » devient alors la section de tête. ── */}
          {open.length > 0 ? (
            <section className="px-7 pt-12 md:px-16 md:pt-14">
              <div className="mb-6 flex items-baseline justify-between border-b border-foreground pb-5">
                <h2 className="font-serif text-4xl italic">{t("openHeading")}</h2>
                <span className="text-[13px] tracking-wide text-muted-foreground">
                  {t("openCount", { count: open.length })}
                </span>
              </div>
              {open.map((drop) => (
                <CalendarRow key={drop.id} drop={drop} variant="open" serverNowIso={serverNowIso} />
              ))}
            </section>
          ) : null}

          {/* ── À venir : grille 2 colonnes. Promue en tête (titre + trait
              principaux) quand aucun drop n'est en cours. ── */}
          {(() => {
            const lead = open.length === 0;
            return (
              <section className={`px-7 md:px-16 ${lead ? "pt-12 md:pt-14" : "pt-16 md:pt-20"}`}>
                <div
                  className={`mb-6 flex items-baseline justify-between pb-5 ${lead ? "border-b border-foreground" : "border-b border-rule"}`}
                >
                  {lead ? (
                    <h2 className="font-serif text-4xl italic">{t("upcomingHeading")}</h2>
                  ) : (
                    <h3 className="font-serif text-2xl italic">{t("upcomingHeading")}</h3>
                  )}
                  <span className="text-[13px] tracking-wide text-muted-foreground">
                    {t("upcomingCount", { count: upcoming.length })}
                  </span>
                </div>
                {upcoming.length === 0 ? (
                  <p className="py-6 text-ink-2">{t("upcomingEmpty")}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
                    {upcoming.map((drop) => (
                      <UpcomingCard key={drop.id} drop={drop} serverNowIso={serverNowIso} />
                    ))}
                  </div>
                )}
              </section>
            );
          })()}

          {/* ── Passés : volet replié, discret ── */}
          {past.length > 0 ? (
            <section className="px-7 pb-28 pt-16 md:px-16 md:pt-20">
              <details className="group border-t border-rule pt-5">
                <summary className="flex cursor-pointer list-none items-baseline justify-between rounded-sm py-2.5 [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span className="flex items-baseline gap-3">
                    <h3 className="font-serif text-2xl italic text-ink-2 transition-colors group-hover:text-foreground">{t("pastHeading")}</h3>
                    <span className="text-[13px] text-muted-foreground">{t("pastCount", { count: past.length })}</span>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors group-hover:text-foreground">
                    <span className="group-open:hidden">{t("show")}</span>
                    <span className="hidden group-open:inline">{t("hide")}</span>
                  </span>
                </summary>
                <ul className="mt-4">
                  {past.map((drop) => (
                    <li key={drop.id} className="border-b border-rule-soft last:border-0">
                      <Link href={drop.id ? `/drop/${drop.id}` : "#"} className="group/row flex items-baseline justify-between gap-6 rounded-sm py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                        <span className="flex min-w-0 items-baseline gap-5">
                          <span className="shrink-0 font-serif text-sm italic tabular-nums text-muted-foreground">No. {formatDropNumber(drop.drop_number ?? 0)}</span>{/* "No." = nom de marque Drop No., inchangé */}
                          <span className="truncate">
                            <span className="font-serif text-lg italic transition-colors group-hover/row:text-champagne-deep">{drop.title}</span>
                            {drop.brand ? <span className="ml-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{drop.brand.name}</span> : null}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {drop.clearing_price_cents ? formatEuros(drop.clearing_price_cents, locale) : t("cancelled")}
                          {drop.revealed_at || drop.reveal_at ? ` · ${formatShortDate((drop.revealed_at ?? drop.reveal_at) as string, locale)}` : ""}
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
