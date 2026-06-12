import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/service";
import { sendBidConfirmation } from "@/lib/email/send";

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
        // Carte autorisee : la pre-autorisation est posee (requires_capture).
        await markBidAuthorized(event);
        break;
      case "payment_intent.succeeded":
        // Supplement du Privilege No 001 paye (voir Privilege_001.md).
        // Filtre strict sur metadata.kind : les captures des bids gagnants
        // emettent aussi payment_intent.succeeded et ne doivent rien faire ici.
        await maybeAcceptSerialOffer(event);
        break;
      case "payment_intent.canceled":
        await setBidAuthStatusByPi(event, "released");
        break;
      case "payment_intent.payment_failed":
        await setBidAuthStatusByPi(event, "failed");
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
      // Tag de provenance : seulement à la vérification, sinon on n'écrase pas
      // un éventuel kyc_provider existant (cohérence avec le canal itsme).
      ...(status === "verified" ? { kyc_provider: "stripe" as const } : {}),
    })
    .eq("id", userId);
}

/**
 * Carte autorisee pour une offre : bascule stripe_auth_status -> 'authorized'
 * et envoie l'email de confirmation (US-05). Idempotent : le filtre
 * `.neq('authorized')` garantit qu'on n'envoie l'email qu'une seule fois meme
 * si Stripe re-livre l'evenement.
 */
async function markBidAuthorized(event: Stripe.Event) {
  const pi = event.data.object as Stripe.PaymentIntent;
  const supabase = createServiceClient();

  const { data: bid } = await supabase
    .from("bids")
    .update({ stripe_auth_status: "authorized" })
    .eq("stripe_payment_intent_id", pi.id)
    .neq("stripe_auth_status", "authorized")
    .select("drop_id, user_id, amount_cents, submitted_at, amount_hash")
    .maybeSingle();

  // Aucune ligne : offre deja autorisee (re-livraison) ou PI orphelin -> stop.
  if (!bid) return;

  const [{ data: drop }, { data: profile }] = await Promise.all([
    supabase
      .from("drops")
      .select("drop_number, title, hero_image_url")
      .eq("id", bid.drop_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("email")
      .eq("id", bid.user_id)
      .maybeSingle(),
  ]);

  if (profile?.email) {
    await sendBidConfirmation(profile.email, {
      dropNumber: drop?.drop_number ?? 0,
      title: drop?.title ?? "votre pièce",
      amountCents: bid.amount_cents,
      submittedAt: bid.submitted_at,
      hash: bid.amount_hash,
      dropId: bid.drop_id,
      imageUrl: drop?.hero_image_url,
    });
  }
}

/**
 * Paiement du supplement Privilege No 001 reussi : accepte l'offre et pose
 * le serial 001 sur la transaction. accept_serial_offer est idempotente
 * (re-livraison webhook safe) et tolere une offre expiree par le cron si le
 * paiement a ete engage avant l'echeance.
 */
async function maybeAcceptSerialOffer(event: Stripe.Event) {
  const pi = event.data.object as Stripe.PaymentIntent;
  if (pi.metadata?.kind !== "serial_offer") return;
  const offerId = pi.metadata?.serial_offer_id;
  if (!offerId) return;

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("accept_serial_offer", {
    p_offer_id: offerId,
    p_payment_intent_id: pi.id,
  });
  if (error) {
    console.error("[webhook] accept_serial_offer a echoue:", error.message);
  }
}

/**
 * Synchronise stripe_auth_status d'une offre depuis un PaymentIntent
 * (annulation / echec). Une pre-autorisation annulee n'est jamais 'authorized',
 * donc l'offre ne pourra pas etre capturee a la cloture.
 */
async function setBidAuthStatusByPi(
  event: Stripe.Event,
  status: "released" | "failed"
) {
  const pi = event.data.object as Stripe.PaymentIntent;
  const supabase = createServiceClient();
  await supabase
    .from("bids")
    .update({ stripe_auth_status: status })
    .eq("stripe_payment_intent_id", pi.id);
}
