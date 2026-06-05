import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DropHero, type DropStatus } from "@/components/drop/drop-hero";
import { DropArt } from "@/components/drop/drop-art";
import { DropSpecs } from "@/components/drop/drop-specs";
import { DropDetail } from "@/components/drop/drop-detail";
import { DropBidForm } from "@/components/drop/drop-bid-form";
import { DropCountdown } from "@/components/drop/drop-countdown";
import type { Tables } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DropPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const serverNowIso = new Date().toISOString();

  const { data: drop } = await supabase
    .from("drops_public")
    .select(
      "id, drop_number, title, description, status, floor_price_cents, exemplaires, bid_count, reveal_at, bid_lock_at, clearing_price_cents, hero_image_url, specs, brand:brands(name, slug)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!drop) notFound();

  const brand = (drop.brand as { name: string; slug: string } | null) ?? null;
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

  return (
    <>
      <DropHero
        dropNumber={drop.drop_number ?? 0}
        title={drop.title ?? ""}
        brandName={brand?.name ?? null}
        brandSlug={brand?.slug ?? null}
        status={status}
        revealAt={drop.reveal_at}
        clearingPriceCents={drop.clearing_price_cents}
      />

      <div className="grid grid-cols-1 px-7 pb-24 md:grid-cols-[1.2fr_1fr] md:gap-16 md:px-16 md:pb-32">
        <div>
          <DropArt
            heroImageUrl={drop.hero_image_url}
            title={drop.title ?? ""}
            seed={drop.drop_number ?? 0}
          />
        </div>

        <div className="pt-8 md:sticky md:top-24 md:self-start md:pt-0">
          {isOpen && drop.reveal_at ? (
            <div className="mb-8 border-y border-rule border-t-foreground py-6">
              <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Révélation dans
              </div>
              <DropCountdown
                targetIso={drop.reveal_at}
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
            isOpen={isOpen}
            isLocked={isLocked}
            existingBidCents={existingBidCents}
            loginHref={loginHref}
          />
        </div>
      </div>

      <DropDetail
        description={drop.description}
        specs={(drop.specs as Record<string, unknown> | null) ?? null}
      />
    </>
  );
}
