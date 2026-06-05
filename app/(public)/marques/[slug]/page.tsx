import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Filigrane } from "@/components/brand/filigrane";
import { countryLabel } from "@/lib/countries";
import { formatDropNumber, formatEuros } from "@/lib/format";

export const dynamic = "force-dynamic";

type Brand = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  country_code: string | null;
  logo_url: string | null;
};

type BrandDrop = {
  id: string;
  drop_number: number | null;
  title: string | null;
  status: string | null;
  clearing_price_cents: number | null;
};

async function getBrand(slug: string): Promise<Brand | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("brands")
    .select("id, slug, name, description, country_code, logo_url")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return (data as Brand | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const brand = await getBrand(params.slug);
  if (!brand) return { title: "Maison introuvable — Drop No." };
  return {
    title: `${brand.name} — Drop No.`,
    description:
      brand.description ??
      `Les drops de ${brand.name} sur Drop No., en direct de la maison.`,
  };
}

function statusLabel(status: string | null, clearingCents: number | null) {
  switch (status) {
    case "open":
      return { text: "En cours", cls: "text-champagne-deep" };
    case "scheduled":
      return { text: "À venir", cls: "text-ink-2" };
    case "cancelled":
      return { text: "Annulé", cls: "text-muted-foreground" };
    default:
      return {
        text: clearingCents
          ? `Clôturé · ${formatEuros(clearingCents)}`
          : "Clôturé",
        cls: "text-muted-foreground",
      };
  }
}

export default async function BrandPage({
  params,
}: {
  params: { slug: string };
}) {
  const brand = await getBrand(params.slug);
  if (!brand) notFound();

  const supabase = createClient();
  const { data: dropsData } = await supabase
    .from("drops_public")
    .select("id, drop_number, title, status, clearing_price_cents")
    .eq("brand_id", brand.id)
    .order("drop_number", { ascending: false });

  const drops = (dropsData ?? []) as BrandDrop[];
  const country = countryLabel(brand.country_code);

  return (
    <>
      <div className="relative overflow-hidden border-b border-rule-soft px-7 pb-16 pt-20 md:px-16 md:pb-20 md:pt-28">
        <Filigrane className="reveal-art pointer-events-none absolute -right-10 top-1/2 z-0 h-60 w-60 -translate-y-1/2 text-[var(--champagne-deep)] opacity-[0.07] md:-right-4 md:h-80 md:w-80" />
        <div className="relative z-10 max-w-3xl">
          <Link
            href="/marques"
            className="eyebrow reveal inline-block text-muted-foreground underline-offset-4 transition-colors hover:text-foreground"
            style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
          >
            ← Maisons
          </Link>
          {country ? (
            <span
              className="eyebrow reveal mt-6 block"
              style={{ "--reveal-delay": "160ms" } as React.CSSProperties}
            >
              {country}
            </span>
          ) : null}
          <h1
            className="font-display reveal mt-3 text-[clamp(3rem,8vw,7rem)]"
            style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
          >
            {brand.name}
          </h1>
          {brand.description ? (
            <p
              className="reveal mt-8 max-w-[58ch] text-lg leading-relaxed text-ink-2"
              style={{ "--reveal-delay": "380ms" } as React.CSSProperties}
            >
              {brand.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="px-7 pb-28 pt-16 md:px-16 md:pt-24">
        <div className="mb-8 flex items-baseline justify-between border-b border-foreground pb-6">
          <h2 className="font-serif text-4xl italic">Ses drops</h2>
          <span className="text-[13px] tracking-wide text-muted-foreground">
            {drops.length > 1
              ? `${drops.length} drops`
              : `${drops.length} drop`}
          </span>
        </div>

        {drops.length === 0 ? (
          <p className="py-8 text-ink-2">
            Aucun drop pour cette maison pour l&apos;instant.
          </p>
        ) : (
          <ul>
            {drops.map((drop) => {
              const s = statusLabel(drop.status, drop.clearing_price_cents);
              return (
                <li key={drop.id} className="border-b border-rule-soft">
                  <Link
                    href={`/drop/${drop.id}`}
                    className="group flex items-baseline justify-between gap-6 py-6 transition-colors hover:bg-[oklch(0.99_0.004_80)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <div className="flex items-baseline gap-5">
                      <span className="font-serif text-sm italic tabular-nums text-muted-foreground">
                        N° {formatDropNumber(drop.drop_number ?? 0)}
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
