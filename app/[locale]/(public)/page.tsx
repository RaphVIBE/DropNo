import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MechanismVariantB } from "@/components/home/mechanism-variant-b";
import { CalendarRow, type CalendarDrop } from "@/components/drop/calendar-row";
import { isAnnounced } from "@/lib/admin/drops";

export const dynamic = "force-dynamic";

const SELECT =
  "id, drop_number, title, status, floor_price_cents, clearing_price_cents, reveal_at, bid_window_opens_at, revealed_at, format, hero_image_url, brand:brands(name, slug)";

/**
 * Homepage : le manifeste en une phrase, le mécanisme en trois temps, puis le
 * produit lui-même — le drop de la semaine (ouvert, sinon le prochain
 * annoncé) — et les maisons. Le footer global porte légal et engagements.
 */
export default async function HomePage() {
  const t = await getTranslations("home");
  const supabase = createClient();
  const serverNowIso = new Date().toISOString();

  const [{ data: dropsData }, { data: brandsData }] = await Promise.all([
    supabase.from("drops_public").select(SELECT).order("reveal_at", { ascending: true }),
    supabase
      .from("brands")
      .select("name, slug")
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(8),
  ]);

  const drops = (dropsData ?? []) as unknown as CalendarDrop[];
  const brands = (brandsData ?? []) as { name: string; slug: string }[];

  const open = drops.find((d) => d.status === "open") ?? null;
  const upcoming = open
    ? null
    : (drops.find(
        (d) =>
          d.status === "scheduled" &&
          isAnnounced(d.bid_window_opens_at, d.format, serverNowIso)
      ) ?? null);
  const featured = open ?? upcoming;

  return (
    <>
      {/* Manifeste + mécanisme */}
      <section className="mx-auto flex max-w-5xl flex-col gap-14 px-7 pb-16 pt-16 md:gap-20 md:px-16 md:pb-20 md:pt-24">
        <div className="flex max-w-3xl flex-col gap-8">
          <p
            className="eyebrow reveal"
            style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
          >
            {t("eyebrow")}
          </p>
          <h1
            className="font-display reveal text-balance text-5xl md:text-7xl"
            style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
          >
            {t("title")}
          </h1>
          <p
            className="reveal max-w-xl text-lg text-ink-2"
            style={{ "--reveal-delay": "380ms" } as React.CSSProperties}
          >
            {t("intro")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="reveal"
              style={{ "--reveal-delay": "520ms" } as React.CSSProperties}
            >
              <Link href="/drops">{t("ctaCalendar")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="reveal"
              style={{ "--reveal-delay": "600ms" } as React.CSSProperties}
            >
              <Link href="/mecanisme">{t("ctaMechanism")}</Link>
            </Button>
          </div>
        </div>

        {/* Mécanisme — flux blueprint vivant du drop scellé en trois temps */}
        <div>
          <MechanismVariantB />
          <div className="mt-8 text-center">
            <Link
              href="/mecanisme"
              className="rounded-sm text-[13px] text-ink-2 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("mechanismDetail")}
            </Link>
          </div>
        </div>
      </section>

      {/* Le drop de la semaine — le produit, pas une promesse */}
      {featured ? (
        <section className="border-t border-rule-soft px-7 pb-8 pt-14 md:px-16 md:pt-16">
          <div className="flex items-baseline justify-between border-b border-foreground pb-5">
            <h2 className="font-serif text-3xl italic md:text-4xl">
              {open ? t("nowTitle") : t("nextTitle")}
            </h2>
            <Link
              href="/drops"
              className="rounded-sm text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("allCalendar")}
            </Link>
          </div>
          <CalendarRow
            drop={featured}
            variant={open ? "open" : "upcoming"}
            serverNowIso={serverNowIso}
          />
        </section>
      ) : null}

      {/* Les maisons */}
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

      {/* Manifeste court */}
      <section className="border-t border-rule-soft px-7 py-20 md:px-16 md:py-28">
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
