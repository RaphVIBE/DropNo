import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MechanismVariantB } from "@/components/home/mechanism-variant-b";
import { HomeDropHero } from "@/components/home/home-drop-hero";
import { HomeEmptyHero } from "@/components/home/home-empty-hero";
import { UpcomingCard } from "@/components/drop/upcoming-card";
import type { CalendarDrop } from "@/components/drop/calendar-row";
import { isAnnounced } from "@/lib/admin/drops";
import { localizedAlternates } from "@/lib/i18n/metadata";

export const dynamic = "force-dynamic";

// Métadonnées : titre/description héritent du layout racine ; on ajoute ici
// les alternates hreflang propres à la home (chemin racine).
export async function generateMetadata() {
  return { alternates: localizedAlternates("/", await getLocale()) };
}

const SELECT =
  "id, drop_number, title, status, floor_price_cents, clearing_price_cents, reveal_at, bid_window_opens_at, revealed_at, format, hero_image_url, brand:brands(name, slug)";

/**
 * Homepage, product-forward : le drop EST le héros (sa pièce, son prix plancher,
 * le compte à rebours, « faire une offre »). À défaut de drop, le héros devient
 * « le premier drop approche » + liste d'attente. Puis le rythme (« à venir »),
 * le mécanisme (acte 2), les maisons, le manifeste.
 */
export default async function HomePage() {
  const t = await getTranslations("home");
  const td = await getTranslations("drops");
  const supabase = createClient();
  const serverNowIso = new Date().toISOString();

  const [{ data: dropsData }, { data: brandsData }] = await Promise.all([
    supabase
      .from("drops_public")
      .select(SELECT)
      .eq("is_demo", false)
      .in("status", ["open", "scheduled"]) // les drops passés vivent au calendrier
      .order("reveal_at", { ascending: true }),
    supabase
      .from("brands")
      .select("name, slug")
      .eq("status", "active")
      .eq("is_demo", false)
      .order("name", { ascending: true })
      .limit(8),
  ]);

  const drops = (dropsData ?? []) as unknown as CalendarDrop[];
  const brands = (brandsData ?? []) as { name: string; slug: string }[];

  const open = drops.find((d) => d.status === "open") ?? null;
  const announcedUpcoming = drops.filter(
    (d) =>
      d.status === "scheduled" &&
      isAnnounced(d.bid_window_opens_at, d.format, serverNowIso)
  );
  // Le héros : le drop ouvert, sinon le prochain drop annoncé.
  const featured = open ?? announcedUpcoming[0] ?? null;
  // Rail « à venir » : les autres drops annoncés (hors héros), 2 max.
  const rail = announcedUpcoming
    .filter((d) => d.id !== featured?.id)
    .slice(0, 2);
  // Preuve pour l'état vide : le dernier drop révélé avec un prix de clôture.
  // Requête ciblée (1 ligne) et seulement s'il n'y a rien à mettre en avant —
  // sinon la home ne charge aucun drop passé (ceux-ci vivent au calendrier).
  let lastRevealed: CalendarDrop | null = null;
  if (!featured) {
    const { data: lastData } = await supabase
      .from("drops_public")
      .select(SELECT)
      .eq("is_demo", false)
      .eq("status", "revealed")
      .not("clearing_price_cents", "is", null)
      .order("revealed_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    lastRevealed = (lastData as unknown as CalendarDrop) ?? null;
  }

  return (
    <>
      {/* ── HÉROS : le drop (ou, à défaut, le premier drop à venir + waitlist) ── */}
      {featured ? (
        <HomeDropHero drop={featured} open={!!open} serverNowIso={serverNowIso} />
      ) : (
        <HomeEmptyHero lastDrop={lastRevealed} />
      )}

      {/* ── À VENIR : le rythme hebdo (masqué si rien de programmé) ── */}
      {rail.length > 0 ? (
        <section className="border-t border-rule-soft px-7 py-12 md:px-16 md:py-16">
          <div className="mb-2 flex items-baseline justify-between border-b border-rule pb-5">
            <h2 className="font-serif text-2xl italic">{td("upcomingHeading")}</h2>
            <Link
              href="/drops"
              className="rounded-sm text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("allCalendar")}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
            {rail.map((drop) => (
              <UpcomingCard key={drop.id} drop={drop} serverNowIso={serverNowIso} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── ACTE 2 : le mécanisme (l'explication vient après le désir) ──
          Deux colonnes : la copie à gauche, le schéma blueprint (vertical) à
          droite — même rythme gauche/droite que le héros, plus de vide. */}
      <section className="border-t border-rule-soft bg-sand px-7 py-16 md:px-16 md:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
          <div className="flex max-w-xl flex-col gap-7">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="font-display text-balance text-4xl md:text-5xl">
              {t("title")}
            </h2>
            <p className="text-lg text-ink-2">{t("intro")}</p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/drops">{t("ctaCalendar")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/mecanisme">{t("ctaMechanism")}</Link>
              </Button>
            </div>
            <Link
              href="/mecanisme"
              className="w-fit rounded-sm text-[13px] text-ink-2 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("mechanismDetail")}
            </Link>
          </div>

          <div className="mx-auto w-full max-w-sm md:mx-0 md:max-w-xs">
            <MechanismVariantB orientation="compact" />
          </div>
        </div>
      </section>

      {/* ── Les maisons ── */}
      {brands.length > 0 ? (
        <section className="border-t border-rule-soft px-7 py-14 md:px-16 md:py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-2">
            <span className="eyebrow">{t("housesTitle")}</span>
            <Link
              href="/marques"
              className="rounded-sm text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("housesDirect")}
            </Link>
          </div>
          <ul className="mt-7 flex flex-wrap items-baseline gap-x-10 gap-y-4">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/marques/${b.slug}`}
                  className="rounded-sm font-serif text-[clamp(1.5rem,3vw,2.25rem)] italic text-ink-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Manifeste court ── */}
      <section className="border-t border-rule-soft bg-sand px-7 py-20 md:px-16 md:py-28">
        <p className="font-display mx-auto max-w-[26ch] text-center text-[clamp(1.6rem,3.5vw,2.5rem)]">
          {t("manifesto")}
        </p>
        <p className="mx-auto mt-6 max-w-[52ch] text-center text-base leading-relaxed text-ink-2">
          {t("manifestoSub")}
        </p>
        <div className="mt-9 text-center">
          <Link
            href="/a-propos"
            className="rounded-sm text-sm text-ink-2 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("aboutLink")}
          </Link>
        </div>
      </section>
    </>
  );
}
