import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe/client";
import { isOfferActionable } from "@/lib/privilege";

export const dynamic = "force-dynamic";

/**
 * Prépare le paiement du supplément du Privilège № 001 (voir Privilege_001.md).
 *
 * La pré-autorisation du bid a déjà été capturée au clearing par close-drop
 * (une PaymentIntent = une seule capture) : le supplément passe donc par une
 * NOUVELLE PaymentIntent on-session, capture automatique, confirmée via
 * Stripe Elements. L'acceptation effective (serial_no posé) est faite par
 * accept_serial_offer, déclenchée par le webhook payment_intent.succeeded
 * (et en ceinture-bretelles par /confirm).
 *
 * Sans STRIPE_SECRET_KEY (dev) : acceptation directe sans étape carte,
 * symétrique au comportement de /api/bids.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // RLS : ne renvoie l'offre que si elle appartient à l'utilisateur.
  const { data: offer } = await supabase
    .from("serial_offers")
    .select("id, user_id, drop_id, supplement_cents, status, expires_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
  }
  if (!isOfferActionable(offer.status, offer.expires_at)) {
    return NextResponse.json(
      { error: "Cette offre n'est plus disponible." },
      { status: 409 }
    );
  }

  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

  if (!stripeConfigured) {
    // Dev sans clé Stripe : acceptation directe (parité avec /api/bids).
    const service = createServiceClient();
    const { data, error } = await service.rpc("accept_serial_offer", {
      p_offer_id: offer.id,
      p_payment_intent_id: "dev_no_stripe",
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, accepted: true, result: data });
  }

  const stripe = getStripe();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  // Paiement on-session, capture automatique (pas de pré-auth ici).
  const pi = await stripe.paymentIntents.create({
    amount: offer.supplement_cents,
    currency: "eur",
    customer: profile?.stripe_customer_id ?? undefined,
    metadata: {
      kind: "serial_offer",
      serial_offer_id: offer.id,
      drop_id: offer.drop_id,
      user_id: user.id,
    },
  });

  return NextResponse.json({
    ok: true,
    clientSecret: pi.client_secret,
    amountCents: offer.supplement_cents,
  });
}
