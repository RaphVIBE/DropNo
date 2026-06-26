import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { isValidDemoKey } from "@/lib/demo-access";
import { computeSim } from "@/lib/demo-maisons";
import { DropAssurance } from "@/components/drop/drop-assurance";
import { DropHero, type DropStatus } from "@/components/drop/drop-hero";
import { DropGallery } from "@/components/drop/drop-gallery";
import { DropSpecs } from "@/components/drop/drop-specs";
import { DropDetail } from "@/components/drop/drop-detail";
import { DropBidForm } from "@/components/drop/drop-bid-form";
import { DropCountdown } from "@/components/drop/drop-countdown";
import { DemoReveal } from "@/components/demo/demo-reveal";
import type { Locale } from "@/i18n/routing";

/**
 * Démo prospect : la fiche d'un drop fictif (is_demo) d'une maison prospect,
 * rendue en page AUTONOME sous /demo/<slug>?key=<DEMO_KEY>.
 *
 * Pourquoi une page autonome (et pas une redirection vers /drop/[id]) :
 *  - /demo est laissé passer par la barrière SITE_LOCKED (lib/construction-gate),
 *    donc la démo n'est JAMAIS derrière la page « bientôt » ;
 *  - pas de barre de navigation ici : aucun lien ne ramène vers le site
 *    verrouillé, le prospect reste sur sa simulation.
 *
 * Clé absente ou fausse, maison/drop introuvable -> 404 neutre.
 */

export const dynamic = "force-dynamic";

const SELECT =
  "id, drop_number, title, description, description_en, status, floor_price_cents, exemplaires, bid_count, bid_window_opens_at, reveal_at, bid_lock_at, clearing_price_cents, hero_image_url, images_urls, specs, specs_en, brand:brands(name, slug)";

export async function generateMetadata(): Promise<Metadata> {
  // Jamais indexée.
  return { robots: { index: false, follow: false } };
}

export default async function DemoDropPage({
  params,
  searchParams,
}: {
  params: { locale: Locale; slug: string };
  searchParams: { key?: string };
}) {
  // Garde d'accès : clé propre à cette maison, sinon 404 neutre (on ne révèle
  // rien). Une maison ne peut pas deviner la simulation d'une autre.
  if (!isValidDemoKey(params.slug, searchParams.key)) {
    notFound();
  }

  const t = await getTranslations("dropDetail");
  const supabase = createClient();
  const serverNowIso = new Date().toISOString();

  // Maison démo correspondant au slug.
  const { data: brand } = await supabase
    .from("brands")
    .select("id, name")
    .eq("slug", params.slug)
    .eq("is_demo", true)
    .maybeSingle();
  if (!brand) notFound();

  // Son drop démo le plus récent.
  const { data: drop } = await supabase
    .from("drops_public")
    .select(SELECT)
    .eq("brand_id", brand.id)
    .eq("is_demo", true)
    .order("drop_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!drop) notFound();

  // Détection d'ouverture : journal en base (best-effort, jamais bloquant).
  // `force-dynamic` => s'exécute à chaque ouverture du lien.
  try {
    const h = headers();
    await supabase.rpc("log_demo_visit", {
      p_slug: params.slug,
      p_surface: "drop",
      p_locale: params.locale,
      p_ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      p_ua: h.get("user-agent") ?? "",
      p_path: `/demo/${params.slug}`,
    });
  } catch {
    // détection best-effort, ne bloque jamais le rendu de la démo
  }

  // Simulation de gain (chiffres illustratifs partagés avec la page maison).
  const sim = computeSim(params.slug, drop.exemplaires ?? 0);

  const brandJoin = (drop.brand as { name: string; slug: string } | null) ?? null;
  const brandName = brandJoin?.name ?? brand.name ?? null;
  const status = (drop.status ?? "open") as DropStatus;
  const isOpen = status === "open";
  const isLocked = drop.bid_lock_at
    ? new Date(drop.bid_lock_at) <= new Date(serverNowIso)
    : false;

  // Compteur : révélation (drop ouvert) ou ouverture (à venir).
  const counter =
    isOpen && drop.reveal_at
      ? { label: t("countdownReveal"), target: drop.reveal_at }
      : status === "scheduled" && drop.bid_window_opens_at
        ? { label: t("countdownOpen"), target: drop.bid_window_opens_at }
        : null;

  // Le bouton « se connecter » du panneau d'offre reste sur la démo (jamais
  // vers /login, qui est verrouillé).
  const selfHref = `/demo/${params.slug}?key=${searchParams.key ?? ""}`;
  // Lien vers la fiche maison (reste dans /demo, porte la clé). FR par défaut
  // sans préfixe de locale.
  const prefix = params.locale === "fr" ? "" : `/${params.locale}`;
  const maisonHref = `${prefix}/demo/${params.slug}/maison?key=${searchParams.key ?? ""}`;

  const preparedDate = new Intl.DateTimeFormat(params.locale, {
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
            <span className="text-foreground">{brandName}</span> · {preparedDate}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("demoBanner")}
          </p>
        </div>
      </div>

      <DropHero
        dropNumber={drop.drop_number ?? 0}
        title={drop.title ?? ""}
        brandName={brandName}
        brandSlug={null}
        status={status}
        revealAt={drop.reveal_at}
      />

      {/* Cadrage : ceci est l'aperçu d'une future sortie en exclusivité. */}
      <div className="border-b border-rule-soft px-7 pt-4 md:px-16">
        <p className="text-[12px] italic text-muted-foreground">
          {t("demoExampleLine")}
        </p>
      </div>

      <div className="grid grid-cols-1 px-7 pb-24 pt-10 md:grid-cols-[1.2fr_1fr] md:gap-16 md:px-16 md:pb-32 md:pt-14">
        <div>
          <DropGallery
            heroImageUrl={drop.hero_image_url}
            imagesUrls={(drop.images_urls as string[] | null) ?? null}
            title={drop.title ?? ""}
            seed={drop.drop_number ?? 0}
          />
          <p className="mt-3 text-[11px] italic text-muted-foreground">
            {t("demoPhotosCaption", { brand: brandName ?? "" })}
          </p>
        </div>

        <div className="pt-8 md:sticky md:top-10 md:self-start md:pt-0">
          {sim && isOpen ? (
            <DemoReveal
              brandName={brandName ?? ""}
              pieceTitle={drop.title ?? ""}
              dropNumber={drop.drop_number ?? 0}
              clearingCents={sim.clearingCents}
              exemplaires={drop.exemplaires ?? sim.editionPieces}
              locale={params.locale}
            />
          ) : counter ? (
            <div className="mb-8 border-y border-rule border-t-foreground py-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {counter.label}
                </span>
              </div>
              <DropCountdown
                targetIso={counter.target}
                serverNowIso={serverNowIso}
                variant="full"
              />
            </div>
          ) : null}

          <DropSpecs
            floorPriceCents={drop.floor_price_cents ?? 0}
            exemplaires={drop.exemplaires ?? 0}
          />

          <DropBidForm
            dropId={drop.id ?? ""}
            floorPriceCents={drop.floor_price_cents ?? 0}
            bidCount={drop.bid_count ?? 0}
            isAuthenticated={false}
            kycStatus="pending"
            status={status}
            isOpen={isOpen}
            isLocked={isLocked}
            clearingPriceCents={drop.clearing_price_cents ?? null}
            existingBidCents={null}
            loginHref={selfHref}
          />

          <DropAssurance />

          {brandName ? (
            <div className="mt-8 border-t border-rule-soft pt-6">
              <a
                href={maisonHref}
                className="group inline-flex items-baseline gap-2 rounded-sm text-[13px] uppercase tracking-[0.16em] text-champagne-deep underline-offset-4 transition-colors hover:underline"
              >
                La maison · {brandName}
                <span className="transition-transform group-hover:translate-x-0.5">
                  {"→"}
                </span>
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <DropDetail
        description={drop.description}
        specs={(drop.specs as Record<string, unknown> | null) ?? null}
        descriptionEn={drop.description_en ?? null}
        specsEn={(drop.specs_en as Record<string, unknown> | null) ?? null}
      />
    </>
  );
}
