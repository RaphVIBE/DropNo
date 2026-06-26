import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { isValidDemoKey } from "@/lib/demo-access";
import { BoutiqueHero } from "@/components/brand/boutique-hero";
import { countryLabel } from "@/lib/countries";
import { formatDropNumber, formatEuros } from "@/lib/format";
import { MAISONS } from "@/lib/demo-maisons";
import { headers } from "next/headers";
import type { Locale } from "@/i18n/routing";

/**
 * Démo prospect — page MAISON autonome sous /demo/<slug>/maison?key=<DEMO_KEY>.
 *
 * Donne au prospect une fiche maison réaliste (qui il est, ce qu'il fait),
 * dans l'esprit des pages /marques, mais :
 *  - autonome (aucun lien ne ramène vers le site verrouillé) ;
 *  - gated par la clé démo ;
 *  - les liens internes (vers la fiche du drop démo) portent la clé.
 *
 * Le contenu éditorial vit dans MAISONS (faits réels sur la maison) ; le drop
 * lui-même reste fictif et clairement marqué « simulation ».
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } };
}

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

export default async function DemoMaisonPage({
  params,
  searchParams,
}: {
  params: { locale: Locale; slug: string };
  searchParams: { key?: string };
}) {
  // Garde d'accès : clé propre à cette maison, sinon 404 neutre.
  if (!isValidDemoKey(params.slug, searchParams.key)) {
    notFound();
  }

  const t = await getTranslations("dropDetail");
  const locale = params.locale;
  const supabase = createClient();

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, country_code")
    .eq("slug", params.slug)
    .eq("is_demo", true)
    .maybeSingle();
  if (!brand) notFound();

  const content = MAISONS[params.slug];
  if (!content) notFound();

  // Détection d'ouverture : journal en base (best-effort, jamais bloquant).
  try {
    const h = headers();
    await supabase.rpc("log_demo_visit", {
      p_slug: params.slug,
      p_surface: "maison",
      p_locale: locale,
      p_ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      p_ua: h.get("user-agent") ?? "",
      p_path: `/demo/${params.slug}/maison`,
    });
  } catch {
    // détection best-effort
  }

  const { data: dropsData } = await supabase
    .from("drops_public")
    .select("id, drop_number, title, status, clearing_price_cents, exemplaires")
    .eq("brand_id", brand.id)
    .eq("is_demo", true)
    .order("drop_number", { ascending: false });

  const drops = (dropsData ?? []) as {
    id: string;
    drop_number: number | null;
    title: string | null;
    status: string | null;
    clearing_price_cents: number | null;
    exemplaires: number | null;
  }[];

  const country = countryLabel(brand.country_code);
  const pieces = drops.reduce((sum, d) => sum + (d.exemplaires ?? 0), 0);

  // Bande « ce qu'un drop révélerait » : chiffres illustratifs (content.sim),
  // delta calculé sur le nombre d'exemplaires de la simulation.
  const editionPieces = pieces > 0 ? pieces : 1;
  const perPieceCents = content.sim.clearingCents - content.sim.attenduCents;
  const editionGainCents = perPieceCents * editionPieces;
  const gainPct = Math.round(
    (perPieceCents / content.sim.attenduCents) * 100,
  );

  // Liens internes : restent dans /demo et portent la clé. Le FR par défaut
  // n'a pas de préfixe de locale (localePrefix « as-needed »).
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const key = searchParams.key ?? "";
  const dropHref = `${prefix}/demo/${params.slug}?key=${key}`;

  const facts = [
    { label: "Pays", value: country ?? "—" },
    { label: "Fondée", value: content.founded },
    { label: "Signature", value: content.signature },
    { label: "Pièces (cette série)", value: pieces > 0 ? String(pieces) : "—" },
  ];

  const preparedDate = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <>
      {/* En-tête : aperçu privé préparé pour la maison. Sobre, non cliquable. */}
      <header className="flex items-center justify-between gap-4 border-b border-rule-soft px-7 py-5 md:px-16">
        <span className="font-serif text-lg italic">Drop No.</span>
        <span className="text-[10px] uppercase tracking-[0.24em] text-champagne-deep">
          {t("demoPreview")}
        </span>
      </header>

      {/* Filet « préparé pour {maison} » + mention légale discrète. */}
      <div className="border-b border-rule-soft bg-sand px-7 py-2.5 md:px-16">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <p className="text-[11px] tracking-wide text-muted-foreground">
            {t("demoPreparedFor")}{" "}
            <span className="text-foreground">{brand.name}</span> · {preparedDate}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("demoBanner")}
          </p>
        </div>
      </div>

      {/* Hero vitrine. */}
      <section className="relative overflow-hidden border-b border-rule-soft">
        <BoutiqueHero
          seed={brand.name}
          className="reveal-art h-64 w-full [--art-opacity:1] sm:h-80 md:h-[26rem]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[oklch(0.16_0.012_60)]/85 via-[oklch(0.16_0.012_60)]/15 to-[oklch(0.16_0.012_60)]/60" />
        <div className="absolute inset-0 flex flex-col justify-between px-7 py-7 md:px-16 md:py-9">
          <a
            href={dropHref}
            className="reveal inline-flex w-fit items-center rounded-sm text-[11px] uppercase tracking-[0.18em] text-[oklch(0.94_0.01_80)]/85 underline-offset-4 drop-shadow-[0_1px_8px_oklch(0.16_0.012_60/0.8)] transition-colors hover:text-[oklch(0.98_0.006_80)]"
            style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
          >
            {"←"} Retour au drop
          </a>
          <h1
            className="font-display reveal max-w-[14ch] text-[clamp(2.6rem,7vw,6rem)] text-[oklch(0.97_0.008_82)] drop-shadow-[0_2px_18px_oklch(0.16_0.012_60/0.6)]"
            style={{ "--reveal-delay": "200ms" } as React.CSSProperties}
          >
            {brand.name}
          </h1>
        </div>
      </section>

      {/* Lead éditoriale. */}
      <div className="border-b border-rule-soft bg-sand px-7 pb-14 pt-12 md:px-16 md:pb-16 md:pt-14">
        <div className="max-w-[58ch] space-y-5">
          {content.lead.map((p, i) => (
            <p key={i} className="reveal text-lg leading-relaxed text-ink-2">
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* Bandeau de faits. */}
      <div className="grid grid-cols-2 gap-px border-b border-rule-soft bg-rule-soft md:grid-cols-4">
        {facts.map((f) => (
          <Fact key={f.label} label={f.label} value={f.value} />
        ))}
      </div>

      {/* Bande « ce qu'un drop révélerait » — chiffres illustratifs, marqués
          comme simulation. C'est la valeur, en euros, avant tout discours. */}
      <div className="border-b border-rule-soft bg-ink px-7 pb-14 pt-12 text-[oklch(0.95_0.008_82)] md:px-16 md:pb-16 md:pt-14">
        <div className="max-w-[70ch]">
          <p className="text-[10px] uppercase tracking-[0.24em] text-champagne-deep">
            Simulation · à titre d&rsquo;illustration
          </p>
          <h2 className="font-serif mt-3 text-3xl italic md:text-4xl">
            Ce qu&rsquo;un drop scellé pourrait révéler
          </h2>

          <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[oklch(0.95_0.008_82)]/55">
                Prix attendu
              </div>
              <div className="font-serif mt-1.5 text-2xl italic text-[oklch(0.95_0.008_82)]/70 line-through decoration-[oklch(0.72_0.07_80)]/60">
                {formatEuros(content.sim.attenduCents, locale)}
              </div>
            </div>
            <div className="self-center text-champagne-deep">{"→"}</div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[oklch(0.95_0.008_82)]/55">
                Prix unitaire révélé
              </div>
              <div className="font-serif mt-1.5 text-[2.6rem] leading-none italic text-[oklch(0.98_0.006_80)]">
                {formatEuros(content.sim.clearingCents, locale)}
              </div>
            </div>
            <div className="rounded-sm border border-[oklch(0.72_0.07_80)]/40 px-3 py-1.5 text-[13px] tracking-wide text-champagne-deep">
              +{gainPct}%
            </div>
          </div>

          <p className="mt-7 text-[15px] leading-relaxed text-[oklch(0.95_0.008_82)]/80">
            Soit{" "}
            <span className="text-[oklch(0.98_0.006_80)]">
              +{formatEuros(perPieceCents, locale)} par pièce
            </span>{" "}
            et{" "}
            <span className="text-[oklch(0.98_0.006_80)]">
              +{formatEuros(editionGainCents, locale)} sur l&rsquo;édition de{" "}
              {editionPieces}
            </span>
            . La N-ième offre fixe le prix ; tous les gagnants paient ce même
            prix unique. Aucun calcul ne donne ce nombre à l&rsquo;avance, il
            vit dans la tête des collectionneurs.
          </p>
        </div>
      </div>

      {/* Repères maison. */}
      <div className="border-b border-rule-soft px-7 pb-16 pt-14 md:px-16">
        <h2 className="font-serif mb-8 text-3xl italic">Repères</h2>
        <dl className="grid grid-cols-1 gap-px overflow-hidden border border-rule-soft bg-rule-soft sm:grid-cols-2">
          {content.reperes.map((r) => (
            <div key={r.label} className="bg-background px-7 py-6">
              <dt className="eyebrow">{r.label}</dt>
              <dd className="mt-1.5 text-[15px] leading-snug text-foreground">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Le drop de cette maison (renvoie sur la fiche démo). */}
      <div className="px-7 pb-28 pt-16 md:px-16 md:pt-20">
        <div className="mb-8 flex items-baseline justify-between border-b border-foreground pb-6">
          <h2 className="font-serif text-4xl italic">Son drop</h2>
          <span className="text-[13px] tracking-wide text-muted-foreground">
            {drops.length} en simulation
          </span>
        </div>

        {drops.length === 0 ? (
          <p className="py-8 text-ink-2">Aucun drop pour le moment.</p>
        ) : (
          <ul>
            {drops.map((drop) => (
              <li key={drop.id} className="border-b border-rule-soft">
                <a
                  href={dropHref}
                  className="group flex items-baseline justify-between gap-6 py-6 transition-colors hover:bg-[oklch(0.99_0.004_80)]"
                >
                  <div className="flex items-baseline gap-5">
                    <span className="font-serif text-sm italic tabular-nums text-muted-foreground">
                      No. {formatDropNumber(drop.drop_number ?? 0)}
                    </span>
                    <span className="font-serif text-[22px] italic text-foreground transition-transform group-hover:translate-x-0.5">
                      {drop.title}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-champagne-deep">
                    {drop.clearing_price_cents
                      ? formatEuros(drop.clearing_price_cents, locale)
                      : "En cours"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
