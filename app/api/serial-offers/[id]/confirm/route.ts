import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/**
 * Confirmation synchrone du Privilège № 001 après paiement Elements.
 *
 * Le webhook payment_intent.succeeded fait foi, mais ce endpoint permet à
 * l'UI d'afficher la confirmation sans attendre la livraison du webhook.
 * Sécurité : on ne croit jamais le client — le PaymentIntent est relu chez
 * Stripe et doit être `succeeded`, porter kind=serial_offer et pointer sur
 * cette offre et cet utilisateur. accept_serial_offer est idempotente.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let paymentIntentId: string | undefined;
  try {
    paymentIntentId = (await request.json())?.paymentIntentId;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "paymentIntentId manquant." },
      { status: 400 }
    );
  }

  const pi = await getStripe().paymentIntents.retrieve(paymentIntentId);

  if (
    pi.status !== "succeeded" ||
    pi.metadata?.kind !== "serial_offer" ||
    pi.metadata?.serial_offer_id !== params.id ||
    pi.metadata?.user_id !== user.id
  ) {
    return NextResponse.json(
      { error: "Paiement non confirmé." },
      { status: 409 }
    );
  }

  const service = createServiceClient();
  const { data, error } = await service.rpc("accept_serial_offer", {
    p_offer_id: params.id,
    p_payment_intent_id: pi.id,
  });
  if (error) {
    console.error("[serial-offer/confirm] accept échoué:", error.message);
    return NextResponse.json({ error: "Confirmation impossible." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, result: data });
}
