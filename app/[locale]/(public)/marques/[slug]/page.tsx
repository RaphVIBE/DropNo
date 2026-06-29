import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { BoutiqueHero } from "@/components/brand/boutique-hero";
import { countryLabel } from "@/lib/countries";
import { formatDropNumber, formatEuros } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/i18n/metadata";

export const dynamic = "force-dynamic";

type Brand = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  country_code: string | null;
  kbis_verified: boolean;
  website_url: string | null;
};

type BrandDrop = {
  id: string;
  drop_number: number | null;
  title: string | null;
  status: string | null;
  clearing_price_cents: number | null;
  exemplaires: number | null;
};

async function getBrand(slug: string): Promise<Brand | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("brands")
    .select(
      "id, slug, name, description, country_code, kbis_verified, website_url"
    )
    .eq("slug", slug)
    .eq("status", "active")
    .eq("is_demo", false) // une maison démo n'est pas joignable en vitrine publique
    .maybeSingle();
  return (data as Brand | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const t = await getTranslations("marques");
  const brand = await getBrand(params.slug);
  if (!brand) return { title: t("notFoundMetaTitle") };
  const locale = await getLocale();
  return {
    title: t("brandMetaTitle", { name: brand.name }),
    description:
      brand.description ?? t("brandMetaDescription", { name: brand.name }),
    alternates: localizedAlternates(`/marques/${params.slug}`, locale),
  };
}

function statusLabel(
  status: string | null,
  clearingCents: number | null,
  t: (key: string, values?: Record<string, string>) => string,
  locale: Locale
) {
  switch (status) {
    case "open":
      return { text: t("statusOpen"), cls: "text-champagne-deep" };
    case "scheduled":
      return { text: t("statusScheduled"), cls: "text-ink-2" };
    case "cancelled":
      return { text: t("statusCancelled"), cls: "text-muted-foreground" };
    default:
      return {
        text: clearingCents
          ? t("statusClosedPrice", { price: formatEuros(clearingCents, locale) })
          : t("statusClosed"),
        cls: "text-muted-foreground",
      };
  }
}

/** Bloc de fait — même gabarit pour toutes les maisons (label + valeur serif). */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background px-7 py-6 md:px-9">
      <div className="eyebrow">{label}</div>
      <div className="font-serif mt-2 text-[22px] italic leading-none text-foreground">
        {value}
      </div>
    </div>
  );
}

export default async function BrandPage({
  params,
}: {
  params: { slug: string };
}) {
  const t = await getTranslations("marques");
  const locale = (await getLocale()) as Locale;
  const brand = await getBrand(params.slug);
  if (!brand) notFound();

  const supabase = createClient();
  const { data: dropsData } = await supabase
    .from("drops_public")
    .select("id, drop_number, title, status, clearing_price_cents, exemplaires")
    .eq("brand_id", brand.id)
    .order("drop_number", { ascending: false });

  const drops = (dropsData ?? []) as BrandDrop[];
  const country = countryLabel(brand.country_code);

  // Faits uniformes (mêmes slots pour chaque maison, calculés depuis les données)
  const pieces = drops.reduce((sum, d) => sum + (d.exemplaires ?? 0), 0);
  const facts = [
    { label: t("factCountry"), value: country ?? "—" },
    {
      label: t("factHouse"),
      value: brand.kbis_verified ? t("verified") : t("independent"),
    },
    { label: t("factDrops"), value: String(drops.length) },
    { label: t("factPieces"), value: pieces > 0 ? String(pieces) : "—" },
  ];

  // Lead éditoriale : la description si présente, sinon une signature constante.
  const lead = brand.description ?? t("leadFallback", { name: brand.name });

  return (
    <>
      {/* Hero « vitrine » — bandeau pleine largeur, nom de la maison en
          surimpression sur un voile degrade pour la lisibilite. */}
      <section className="relative overflow-hidden border-b border-rule-soft">
        <BoutiqueHero
          seed={brand.name}
          className="reveal-art h-56 w-full [--art-opacity:1] sm:h-72 md:h-[20rem]"
        />
        {/* Voile : sombre en bas (sous le nom) et en haut (sous le fil
            d'Ariane), transparent au centre pour laisser voir la vitrine. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[oklch(0.16_0.012_60)]/85 via-[oklch(0.16_0.012_60)]/15 to-[oklch(0.16_0.012_60)]/60" />
        <div className="absolute inset-0 flex flex-col justify-between px-7 py-7 md:px-16 md:py-9">
          <Link
            href="/marques"
            className="reveal inline-flex w-fit items-center rounded-sm text-[11px] uppercase tracking-[0.18em] text-[oklch(0.94_0.01_80)]/85 underline-offset-4 drop-shadow-[0_1px_8px_oklch(0.16_0.012_60/0.8)] transition-colors hover:text-[oklch(0.98_0.006_80)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
          >
            {t("backToBrands")}
          </Link>
          <h1
            className="font-display reveal max-w-[14ch] text-[clamp(2.4rem,4.5vw,4rem)] text-[oklch(0.97_0.008_82)] drop-shadow-[0_2px_18px_oklch(0.16_0.012_60/0.6)]"
            style={{ "--reveal-delay": "200ms" } as React.CSSProperties}
          >
            {brand.name}
          </h1>
        </div>
      </section>

      {/* Lead editoriale + lien officiel */}
      <div className="border-b border-rule-soft bg-sand px-7 pb-12 pt-11 md:px-16 md:pb-14 md:pt-12">
        <p className="reveal max-w-[58ch] text-lg leading-relaxed text-ink-2">
          {lead}
        </p>
        {brand.website_url ? (
          <a
            href={brand.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="reveal mt-7 inline-flex items-center gap-1.5 rounded-sm text-[13px] uppercase tracking-[0.16em] text-champagne-deep underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("officialSite")}
          </a>
        ) : null}
      </div>

      {/* Bandeau de faits — gabarit identique pour chaque maison */}
      <div className="grid grid-cols-2 gap-px border-b border-rule-soft bg-rule-soft md:grid-cols-4">
        {facts.map((f) => (
          <Fact key={f.label} label={f.label} value={f.value} />
        ))}
      </div>

      <div className="px-7 pb-28 pt-14 md:px-16 md:pt-16">
        <div className="mb-8 flex items-baseline justify-between border-b border-foreground pb-5">
          <h2 className="font-serif text-[clamp(1.75rem,2.6vw,2.25rem)] italic">
            {t("itsDrops")}
          </h2>
          <span className="text-[13px] tracking-wide text-muted-foreground">
            {t("dropsCount", { count: drops.length })}
          </span>
        </div>

        {drops.length === 0 ? (
          <p className="py-8 text-ink-2">{t("dropsEmpty")}</p>
        ) : (
          <ul>
            {drops.map((drop) => {
              const s = statusLabel(
                drop.status,
                drop.clearing_price_cents,
                t,
                locale
              );
              return (
                <li key={drop.id} className="border-b border-rule-soft">
                  <Link
                    href={`/drop/${drop.id}`}
                    className="group flex items-baseline justify-between gap-6 py-6 transition-colors hover:bg-[oklch(0.99_0.004_80)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <div className="flex items-baseline gap-5">
                      <span className="font-serif text-sm italic tabular-nums text-muted-foreground">
                        No. {formatDropNumber(drop.drop_number ?? 0)}
                      </span>
                      <span className="font-serif text-[22px] italic text-foreground transition-transform group-hover:translate-x-0.5">
                        {drop.title}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 text-[11px] uppercase tracking-[0.18em] ${s.cls}`}
                    >
                      {s.text}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
