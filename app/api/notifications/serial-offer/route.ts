import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { sendSerialOffer } from "@/lib/email/send";

export const dynamic = "force-dynamic";

/**
 * Envoie l'email privé du Privilège № 001 au top bidder (voir Privilege_001.md).
 *
 * Endpoint interne, appelé par l'edge function close-drop juste après la
 * création de l'offre (create_serial_offer). Protégé par le secret partagé
 * x-notify-secret, fail-closed.
 *
 * Idempotence par construction : close-drop ne déclenche cet appel que quand
 * create_serial_offer vient de créer l'offre (created=true). Un re-run de la
 * clôture renvoie already_exists et ne re-déclenche pas l'email.
 *
 * Discrétion : ni la maison ni les autres gagnants ne sont notifiés.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.NOTIFY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "NOTIFY_SECRET non configuré." },
      { status: 503 }
    );
  }
  if (request.headers.get("x-notify-secret") !== secret) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let offerId: string | undefined;
  try {
    offerId = (await request.json())?.offerId;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!offerId) {
    return NextResponse.json({ error: "offerId manquant." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: offer } = await supabase
    .from("serial_offers")
    .select(
      "id, user_id, supplement_cents, expires_at, status, drop:drops(drop_number, title, exemplaires)"
    )
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
  }
  if (offer.status !== "pending") {
    return NextResponse.json({ ok: true, skipped: `status_${offer.status}` });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", offer.user_id)
    .maybeSingle();

  if (!profile?.email) {
    return NextResponse.json({ ok: false, error: "Email destinataire absent." });
  }

  const drop = offer.drop as unknown as {
    drop_number: number | null;
    title: string | null;
    exemplaires: number | null;
  } | null;

  const res = await sendSerialOffer(profile.email, {
    dropNumber: drop?.drop_number ?? 0,
    title: drop?.title ?? "votre pièce",
    exemplaires: drop?.exemplaires ?? 100,
    supplementCents: offer.supplement_cents,
    expiresAt: offer.expires_at,
    offerId: offer.id,
  });

  return NextResponse.json({ ok: res.ok });
}
