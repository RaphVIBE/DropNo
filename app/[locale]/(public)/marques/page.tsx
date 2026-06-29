import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Masthead } from "@/components/brand/masthead";
import { countryLabel } from "@/lib/countries";
import { localizedAlternates } from "@/lib/i18n/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marques");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates("/marques", await getLocale()),
  };
}

type BrandRow = {
  slug: string;
  name: string;
  description: string | null;
  country_code: string | null;
};

export default async function BrandsPage() {
  const t = await getTranslations("marques");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("brands")
    .select("slug, name, description, country_code")
    .eq("status", "active")
    .eq("is_demo", false) // les maisons démo prospects ne sont pas listées
    .order("name", { ascending: true });

  const brands = (data ?? []) as BrandRow[];

  return (
    <>
      <Masthead variant="atelier">
        <span
          className="eyebrow reveal"
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
        >
          {t("eyebrow")}
        </span>
        <h1
          className="font-display reveal mt-5 max-w-[16ch] text-display-page"
          style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
        >
          {t("heroTitle")}
        </h1>
        <p
          className="reveal mt-6 max-w-[52ch] text-base text-ink-2"
          style={{ "--reveal-delay": "380ms" } as React.CSSProperties}
        >
          {t("heroLead")}
        </p>
      </Masthead>

      {error ? (
        <p className="px-7 py-16 text-destructive md:px-16">
          {t("loadError")}
        </p>
      ) : brands.length === 0 ? (
        <p className="px-7 py-16 text-ink-2 md:px-16">
          {t("empty")}
        </p>
      ) : (
        <ul className="border-t border-rule-soft px-7 md:px-16">
          {brands.map((brand, i) => {
            const country = countryLabel(brand.country_code);
            return (
              <li key={brand.slug} className="border-b border-rule-soft">
                <Link
                  href={`/marques/${brand.slug}`}
                  className="group flex flex-col gap-3 py-7 transition-colors hover:bg-[oklch(0.99_0.004_80)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <div className="flex min-w-0 items-baseline gap-5">
                    <span className="font-serif text-sm italic tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-serif text-[26px] italic leading-tight text-foreground transition-transform group-hover:translate-x-0.5">
                        {brand.name}
                      </h2>
                      {brand.description ? (
                        <p className="mt-1 max-w-[60ch] line-clamp-1 text-sm leading-relaxed text-ink-2">
                          {brand.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-5 pl-10 text-[11px] uppercase tracking-[0.18em] sm:pl-0">
                    {country ? (
                      <span className="text-muted-foreground">{country}</span>
                    ) : null}
                    <span className="text-champagne-deep">{t("discover")}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
