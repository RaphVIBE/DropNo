import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Filigrane } from "@/components/brand/filigrane";
import { countryLabel } from "@/lib/countries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maisons · Drop No.",
  description:
    "Les maisons horlogères qui ouvrent leurs drops sur Drop No., en direct des marques.",
};

type BrandRow = {
  slug: string;
  name: string;
  description: string | null;
  country_code: string | null;
};

export default async function BrandsPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("brands")
    .select("slug, name, description, country_code")
    .eq("status", "active")
    .order("name", { ascending: true });

  const brands = (data ?? []) as BrandRow[];

  return (
    <>
      <div className="relative overflow-hidden border-b border-rule-soft px-7 pb-16 pt-20 md:px-16 md:pb-20 md:pt-28">
        <Filigrane className="reveal-art pointer-events-none absolute -right-10 top-1/2 z-0 h-60 w-60 -translate-y-1/2 text-[var(--champagne-deep)] [--art-opacity:0.07] md:-right-4 md:h-80 md:w-80" />
        <div className="relative z-10">
          <span
            className="eyebrow reveal"
            style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
          >
            Maisons
          </span>
          <h1
            className="font-display reveal mt-6 max-w-[12ch] text-[clamp(3.5rem,9vw,8rem)]"
            style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
          >
            En direct des marques.
          </h1>
          <p
            className="reveal mt-6 max-w-[52ch] text-base text-ink-2"
            style={{ "--reveal-delay": "380ms" } as React.CSSProperties}
          >
            Chaque drop est ouvert par une maison, sans intermédiaire ni
            revente. L&apos;authenticité vient de la marque elle-même.
          </p>
        </div>
      </div>

      {error ? (
        <p className="px-7 py-16 text-destructive md:px-16">
          Impossible de charger les maisons pour le moment.
        </p>
      ) : brands.length === 0 ? (
        <p className="px-7 py-16 text-ink-2 md:px-16">
          Les premières maisons seront annoncées très bientôt.
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
                    <span className="text-champagne-deep">Découvrir →</span>
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
