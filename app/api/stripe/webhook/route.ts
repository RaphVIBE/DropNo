import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Webhook Stripe. Verifie la signature, puis route les evenements.
 *
 * KYC (US-26) : les evenements Stripe Identity mettent a jour
 * profiles.kyc_status. Le webhook n'a pas de session utilisateur -> on utilise
 * le client service role (contourne la RLS). On retrouve le profil via
 * metadata.user_id (pose a la creation de la session, cf. identity-session).
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "signature_manquante" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erreur";
    return NextResponse.json(
      { error: `signature_invalide: ${msg}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "identity.verification_session.verified":
        await updateKyc(event, "verified");
        break;
      case "identity.verification_session.processing":
        await updateKyc(event, "verifying");
        break;
      case "identity.verification_session.requires_input":
        // L'utilisateur doit recommencer (document illisible, etc.).
        await updateKyc(event, "rejected");
        break;
      case "identity.verification_session.canceled":
        await updateKyc(event, "pending");
        break;
      case "payment_intent.amount_capturable_updated":
      case "payment_intent.canceled":
        // TODO : synchroniser stripe_auth_status du bid (collecte carte Elements).
        break;
      default:
        break;
    }
  } catch (err) {
    // On logue mais on renvoie 200 : Stripe re-livrera si on renvoie une erreur,
    // sauf si c'est une erreur de notre cote qu'un retry ne corrigera pas.
    const msg = err instanceof Error ? err.message : "erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function updateKyc(
  event: Stripe.Event,
  status: "verified" | "verifying" | "rejected" | "pending"
) {
  const session = event.data.object as Stripe.Identity.VerificationSession;
  const userId = session.metadata?.user_id;
  if (!userId) return;

  const supabase = createServiceClient();
  await supabase
    .from("profiles")
    .update({
      kyc_status: status,
      kyc_stripe_session_id: session.id,
      kyc_verified_at: status === "verified" ? new Date().toISOString() : null,
    })
    .eq("id", userId);
}
