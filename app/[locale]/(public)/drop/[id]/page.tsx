import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { DropAssurance } from "@/components/drop/drop-assurance";
import { DropHero, type DropStatus } from "@/components/drop/drop-hero";
import { DropGallery } from "@/components/drop/drop-gallery";
import { DropSpecs } from "@/components/drop/drop-specs";
import { DropDetail } from "@/components/drop/drop-detail";
import { DropBidForm } from "@/components/drop/drop-bid-form";
import { DropCountdown } from "@/components/drop/drop-countdown";
import { ShareDrop } from "@/components/drop/share-drop";
import { DropAlertBell } from "@/components/drop/drop-alert-bell";
import { DropViewTracker } from "@/components/analytics/DropViewTracker";
import { formatDropNumber, formatEuros, formatRevealMoment } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/i18n/metadata";
import type { Tables } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * Metadata par drop : titre, description et image OG (photo réelle si la
 * maison l'a fournie). Un drop partagé doit se présenter seul.
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dropDetail");
  const { data: drop } = await supabase
    .from("drops_public")
    .select(
      "drop_number, title, floor_price_cents, reveal_at, hero_image_url, brand:brands(name)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!drop) return { title: t("metaNotFound") };

  const brandName = (drop.brand as { name: string } | null)?.name;
  const title = `${drop.title ?? t("dropFallback")}${brandName ? ` · ${brandName}` : ""} · Drop No. ${formatDropNumber(drop.drop_number ?? 0)}`;
  const description = [
    drop.floor_price_cents
      ? t("metaFloorPrice", { price: formatEuros(drop.floor_price_cents, locale) })
      : null,
    drop.reveal_at
      ? t("metaReveal", { moment: formatRevealMoment(drop.reveal_at, locale) })
      : null,
    t("metaTagline"),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    title,
    description,
    alternates: localizedAlternates(`/drop/${params.id}`, locale),
    openGraph: {
      title,
      description,
      ...(drop.hero_image_url ? { images: [{ url: drop.hero_image_url }] } : {}),
    },
  };
}

export default async function DropPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { alert?: string };
}) {
  const supabase = createClient();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dropDetail");
  const serverNowIso = new Date().toISOString();

  const { data: drop } = await supabase
    .from("drops_public")
    .select(
      "id, drop_number, title, description, status, floor_price_cents, exemplaires, bid_count, bid_window_opens_at, reveal_at, bid_lock_at, clearing_price_cents, hero_image_url, images_urls, specs, is_demo, brand:brands(name, slug)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!drop) notFound();

  const brand = (drop.brand as { name: string; slug: string } | null) ?? null;
  // Simulation prospect : bandeau, pas de tracking analytics, pas de lien vers
  // une fiche marque (la maison démo n'est pas joignable en vitrine publique).
  const isDemo = drop.is_demo === true;
  const status = (drop.status ?? "scheduled") as DropStatus;
  const isOpen = status === "open";
  const isLocked = drop.bid_lock_at
    ? new Date(drop.bid_lock_at) <= new Date(serverNowIso)
    : false;

  // Session + KYC + offre existante (RLS : ne renvoie que la sienne).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let kycStatus = "pending";
  let existingBidCents: number | null = null;
  if (user) {
    const [{ data: profile }, { data: rpcBid }] = await Promise.all([
      supabase.from("profiles").select("kyc_status").eq("id", user.id).maybeSingle(),
      supabase.rpc("my_bid_for_drop", { p_drop_id: params.id }).maybeSingle(),
    ]);
    kycStatus = profile?.kyc_status ?? "pending";
    const myBid = rpcBid as unknown as Tables<"bids"> | null;
    if (myBid && myBid.id && myBid.status === "active")
      existingBidCents = myBid.amount_cents;
  }

  const loginHref = `/login?redirect=/drop/${params.id}`;

  const dropLabel = `Drop No. ${formatDropNumber(drop.drop_number ?? 0)}`;
  const shareTitle = `${drop.title ?? t("dropFallback")} · ${dropLabel}`;
  const shareSummary = [
    `${dropLabel}${drop.title ? ` · ${drop.title}` : ""}`,
    drop.floor_price_cents
      ? t("shareFloorPrice", { price: formatEuros(drop.floor_price_cents, locale) })
      : null,
    drop.reveal_at
      ? t("shareReveal", { moment: formatRevealMoment(drop.reveal_at, locale) })
      : null,
  ]
    .filter(Boolean)
    .join(". ");

  // Compteur + cloche d'alerte : révélation (en cours) ou ouverture (à venir).
  const counter =
    isOpen && drop.reveal_at
      ? { label: t("countdownReveal"), target: drop.reveal_at }
      : status === "scheduled" && drop.bid_window_opens_at
        ? { label: t("countdownOpen"), target: drop.bid_window_opens_at }
        : null;
  const canAlert = status === "scheduled" || status === "open";

  return (
    <>
      {isDemo ? (
        <div className="border-y border-champagne bg-sand px-7 py-3 text-center md:px-16">
          <p className="text-[11px] uppercase tracking-[0.2em] text-champagne-deep">
            {t("demoBanner")}
          </p>
        </div>
      ) : (
        <DropViewTracker
          dropId={drop.id ?? params.id}
          dropNumber={drop.drop_number ?? 0}
          dropTitle={drop.title ?? ""}
          brand={brand?.name ?? null}
          dropStatus={status}
        />
      )}
      <DropHero
        dropNumber={drop.drop_number ?? 0}
        title={drop.title ?? ""}
        brandName={brand?.name ?? null}
        brandSlug={isDemo ? null : brand?.slug ?? null}
        status={status}
        revealAt={drop.reveal_at}
      />

      <div className="grid grid-cols-1 px-7 pb-24 pt-10 md:grid-cols-[1.2fr_1fr] md:gap-16 md:px-16 md:pb-32 md:pt-14">
        <div>
          <DropGallery
            heroImageUrl={drop.hero_image_url}
            imagesUrls={(drop.images_urls as string[] | null) ?? null}
            title={drop.title ?? ""}
            seed={drop.drop_number ?? 0}
          />
        </div>

        <div className="pt-8 md:sticky md:top-24 md:self-start md:pt-0">
          {counter ? (
            <div className="mb-8 border-y border-rule border-t-foreground py-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {counter.label}
                </span>
                {canAlert ? (
                  <DropAlertBell
                    dropId={params.id}
                    status={status}
                    flash={searchParams.alert}
                  />
                ) : null}
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
            dropId={params.id}
            floorPriceCents={drop.floor_price_cents ?? 0}
            bidCount={drop.bid_count ?? 0}
            isAuthenticated={!!user}
            kycStatus={kycStatus}
            status={status}
            isOpen={isOpen}
            isLocked={isLocked}
            clearingPriceCents={drop.clearing_price_cents ?? null}
            existingBidCents={existingBidCents}
            loginHref={loginHref}
          />

          <DropAssurance />

          <div className="mt-8 border-t border-rule-soft pt-6">
            <ShareDrop title={shareTitle} summary={shareSummary} />
          </div>
        </div>
      </div>

      <DropDetail
        description={drop.description}
        specs={(drop.specs as Record<string, unknown> | null) ?? null}
      />
    </>
  );
}
