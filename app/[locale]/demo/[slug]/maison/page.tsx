import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { BoutiqueHero } from "@/components/brand/boutique-hero";
import { countryLabel } from "@/lib/countries";
import { formatDropNumber, formatEuros } from "@/lib/format";
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

type Repere = { label: string; value: string };
type MaisonContent = {
  founded: string;
  signature: string;
  lead: string[];
  reperes: Repere[];
};

const MAISONS: Record<string, MaisonContent> = {
  "furlan-marri": {
    founded: "2021",
    signature: "Chronographes néo-vintage",
    lead: [
      "Fondée à Genève en 2021 par Andrea Furlan et Hamad Al Marri, Furlan Marri s'est imposée en une saison comme l'une des révélations de l'horlogerie indépendante, distinguée dès sa première année au Grand Prix d'Horlogerie de Genève.",
      "Sa signature : des chronographes au dessin néo-vintage, cadrans sector et teintes sourdes, produits en séries courtes qui s'épuisent en quelques minutes. Une demande qui dépasse de loin l'offre, drop après drop.",
    ],
    reperes: [
      { label: "Fondateurs", value: "Andrea Furlan & Hamad Al Marri" },
      { label: "Atelier", value: "Genève, Suisse" },
      { label: "Pièces", value: "Chronographes méca-quartz et mécaniques" },
      { label: "Distribution", value: "Vente directe, séries limitées" },
    ],
  },
  ressence: {
    founded: "2010",
    signature: "Cadrans à modules orbitaux",
    lead: [
      "Née à Anvers en 2010 sous l'impulsion du designer Benoît Mintiens, Ressence réinvente la lecture du temps : pas de couronne, pas d'aiguilles classiques, mais des disques orbitaux affleurants, parfois immergés dans l'huile pour fondre les indications dans la glace.",
      "Une horlogerie d'auteur, radicale et belge, produite en très petits volumes. Chaque pièce relève autant du dessin industriel que de la haute horlogerie.",
    ],
    reperes: [
      { label: "Fondateur", value: "Benoît Mintiens" },
      { label: "Atelier", value: "Anvers, Belgique" },
      { label: "Système", value: "ROCS, modules orbitaux sous glace" },
      { label: "Distribution", value: "Très petits volumes" },
    ],
  },
  trilobe: {
    founded: "2018",
    signature: "Heure sans aiguilles",
    lead: [
      "Fondée à Paris en 2018 par Gautier Massonneau, Trilobe lit l'heure autrement : trois disques concentriques tournants, sans aiguille, autour d'un cadran souvent guilloché à la main.",
      "Une manufacture intégrée au cœur de Paris, une production confidentielle et un esprit résolument collectionneur. Une grammaire du temps qui lui est propre.",
    ],
    reperes: [
      { label: "Fondateur", value: "Gautier Massonneau" },
      { label: "Atelier", value: "Paris, France" },
      { label: "Calibre", value: "X-Centric, lecture par disques" },
      { label: "Distribution", value: "Production confidentielle" },
    ],
  },
  "raidillon-55": {
    founded: "2001",
    signature: "Séries de 55, esprit course",
    lead: [
      "Fondée en 2001 par Bernard Julémont et aujourd'hui portée par Fabien de Schaetzen, Raidillon tire son nom de la courbe mythique du circuit de Spa-Francorchamps. Un design belge, des mouvements suisses, une obsession : la course automobile.",
      "Chaque modèle est édité à 55 exemplaires, numérotés de 0 à 55, sans jamais le 13, comme au départ d'une grille. Une rareté inscrite dans l'ADN de la maison.",
    ],
    reperes: [
      { label: "Propriétaire", value: "Fabien de Schaetzen" },
      { label: "Atelier", value: "Bruxelles, Belgique" },
      { label: "Mouvement", value: "Suisse (Sellita)" },
      { label: "Série", value: "55 exemplaires, jamais de n°13" },
    ],
  },
  "col-macarthur": {
    founded: "2014",
    signature: "Un fragment d'Histoire au poignet",
    lead: [
      "Fondée à Liège par Sébastien Colen, Col&MacArthur conçoit des montres commémoratives qui renferment un fragment authentique d'Histoire : sable de Dunkerque, météorite, éclat du Mur de Berlin. Chaque pièce est une histoire qui se porte, assemblée à l'atelier en séries numérotées.",
      "La collection Francorchamps 1921, née d'une collaboration officielle avec le circuit de Spa-Francorchamps, pousse l'idée à l'extrême : cadran taillé dans l'asphalte de la piste, compteurs dans les vibreurs, poussoirs dans l'acier de la Tour Uniroyal. Version automatique limitée à 500 pièces numérotées.",
    ],
    reperes: [
      { label: "Fondateur", value: "Sébastien Colen" },
      { label: "Atelier", value: "Liège, Belgique" },
      { label: "Collaboration", value: "Officielle, Circuit de Spa-Francorchamps" },
      { label: "Francorchamps 1921", value: "Auto Sellita SW500, titane 41 mm, /500" },
    ],
  },
};

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
  // Garde d'accès : sans la bonne clé, 404 neutre.
  if (!process.env.DEMO_KEY || searchParams.key !== process.env.DEMO_KEY) {
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

  return (
    <>
      {/* En-tête minimal NON cliquable : aucun lien sortant vers le site verrouillé. */}
      <div className="flex items-center justify-center border-b border-rule-soft px-7 py-5">
        <span className="font-serif text-lg italic">Drop No.</span>
      </div>

      {/* Bandeau simulation. */}
      <div className="border-b border-champagne bg-sand px-7 py-3 text-center md:px-16">
        <p className="text-[11px] uppercase tracking-[0.2em] text-champagne-deep">
          {t("demoBanner")}
        </p>
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
