import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SerialOfferView } from "@/components/account/serial-offer-view";

export const dynamic = "force-dynamic";

/**
 * Privilège № 001 — écran privé « Une dernière chose » (voir Privilege_001.md).
 *
 * RLS : serial_offers ne renvoie que l'offre du destinataire. Un autre
 * utilisateur (ou un admin via cette page) obtient un 404, jamais une fuite.
 */
export default async function SerialOfferPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: offer } = await supabase
    .from("serial_offers")
    .select(
      "id, status, supplement_cents, expires_at, serial_no, drop:drops(id, drop_number, title, hero_image_url, exemplaires), transaction:transactions(amount_paid_cents)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!offer || offer.status === "expired") notFound();

  const drop = offer.drop as unknown as {
    id: string;
    drop_number: number;
    title: string;
    hero_image_url: string | null;
    exemplaires: number;
  } | null;
  const tx = offer.transaction as unknown as {
    amount_paid_cents: number;
  } | null;
  if (!drop) notFound();

  return (
    <SerialOfferView
      offer={{
        id: offer.id,
        status: offer.status,
        supplementCents: offer.supplement_cents,
        expiresAt: offer.expires_at,
        serialNo: offer.serial_no,
        dropNumber: drop.drop_number,
        title: drop.title,
        heroImageUrl: drop.hero_image_url,
        exemplaires: drop.exemplaires,
        paidCents: tx?.amount_paid_cents ?? null,
      }}
    />
  );
}
