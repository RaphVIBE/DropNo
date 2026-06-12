import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, mapPaymentIntentStatus } from "@/lib/stripe/client";
import { sendBidConfirmation } from "@/lib/email/send";
import type { Tables } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * Soumet ou modifie une offre scellee (US-05).
 *
 * Defense en profondeur : on pre-valide ici, mais la RLS `bids` impose de
 * toute facon KYC verifie + drop ouvert + now < bid_lock_at + montant >= floor.
 * Les triggers DB gerent hash, audit log et bid_count automatiquement.
 *
 * Flow paiement (Phase 1) :
 *  1. On garantit un Stripe Customer pour l'utilisateur (carte enregistrable).
 *  2. On cree un PaymentIntent capture_method=manual (pre-autorisation) +
 *     setup_future_usage=off_session pour reutiliser la carte sur modification.
 *  3. On enregistre l'offre (status active, stripe_auth_status='pending') et on
 *     renvoie le client_secret. Le client confirme la carte via Stripe Elements
 *     -> PI passe en `requires_capture`.
 *  4. Le webhook `payment_intent.amount_capturable_updated` bascule
 *     stripe_auth_status -> 'authorized' et envoie l'email de confirmation.
 *
 * Sans STRIPE_SECRET_KEY (dev sans cle) : pas d'etape carte, l'offre est
 * enregistree en 'pending' et l'email de confirmation est envoye directement.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: { dropId?: string; amountCents?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { dropId, amountCents } = body;
  if (
    !dropId ||
    !amountCents ||
    !Number.isInteger(amountCents) ||
    amountCents <= 0
  ) {
    return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
  }

  // Pre-validation metier (la RLS reste l'autorite finale).
  const { data: drop } = await supabase
    .from("drops_public")
    .select("status, floor_price_cents, bid_lock_at, title, drop_number, hero_image_url")
    .eq("id", dropId)
    .maybeSingle();

  if (!drop || drop.status !== "open") {
    return NextResponse.json(
      { error: "Ce drop n'accepte pas d'offre." },
      { status: 409 }
    );
  }
  if (drop.bid_lock_at && new Date(drop.bid_lock_at) <= new Date()) {
    return NextResponse.json(
      { error: "Les offres sont verrouillées." },
      { status: 409 }
    );
  }
  if (drop.floor_price_cents && amountCents < drop.floor_price_cents) {
    return NextResponse.json(
      { error: "Offre inférieure au prix plancher." },
      { status: 422 }
    );
  }

  // Offre existante ? (RLS : ne renvoie que la sienne)
  const { data: rpcBid } = await supabase
    .rpc("my_bid_for_drop", { p_drop_id: dropId })
    .maybeSingle();
  // RETURNS bids peut renvoyer une ligne tout-null si aucune offre : on garde
  // seulement si un id reel est present.
  const bid = rpcBid as unknown as Tables<"bids"> | null;
  const existing = bid && bid.id ? bid : null;

  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

  // --------------------------------------------------------------------------
  // Cas 1 : Stripe configure -> pre-autorisation via PaymentIntent + Elements.
  // --------------------------------------------------------------------------
  if (stripeConfigured) {
    const stripe = getStripe();

    // 1. Customer Stripe (carte reutilisable). On persiste l'id sur le profil.
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      // stripe_customer_id n'est plus modifiable par l'utilisateur (verrou
      // migration 0027) : on persiste via le service role, borné à sa row.
      await createServiceClient()
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // 2. Nouveau PaymentIntent (pre-autorisation, carte enregistrable).
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      capture_method: "manual",
      customer: customerId,
      setup_future_usage: "off_session",
      metadata: { drop_id: dropId, user_id: user.id, kind: "sealed_bid" },
    });
    const authStatus = mapPaymentIntentStatus(pi.status);

    // 3. Enregistrer l'offre via la session RLS de l'utilisateur.
    //    On pointe l'offre sur le NOUVEAU PI avant d'annuler l'ancien, pour que
    //    l'event webhook `payment_intent.canceled` de l'ancien ne matche plus
    //    aucune ligne (sinon il invaliderait l'offre a jour).
    const previousPiId = existing?.stripe_payment_intent_id ?? null;

    if (existing) {
      const { error } = await supabase
        .from("bids")
        .update({
          amount_cents: amountCents,
          stripe_payment_intent_id: pi.id,
          stripe_auth_status: authStatus,
          status: "active",
        })
        .eq("id", existing.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      const { error } = await supabase.from("bids").insert({
        drop_id: dropId,
        user_id: user.id,
        amount_cents: amountCents,
        stripe_payment_intent_id: pi.id,
        stripe_auth_status: authStatus,
        status: "active",
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Annuler l'ancienne pre-autorisation (apres re-pointage de l'offre).
    if (previousPiId && previousPiId !== pi.id) {
      try {
        await stripe.paymentIntents.cancel(previousPiId);
      } catch {
        // deja annulee/capturee : on ignore.
      }
    }

    return NextResponse.json({
      ok: true,
      amountCents,
      clientSecret: pi.client_secret,
    });
  }

  // --------------------------------------------------------------------------
  // Cas 2 : Stripe non configure (dev) -> offre enregistree sans etape carte.
  // --------------------------------------------------------------------------
  if (existing) {
    const { error } = await supabase
      .from("bids")
      .update({ amount_cents: amountCents, status: "active" })
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else {
    const { error } = await supabase.from("bids").insert({
      drop_id: dropId,
      user_id: user.id,
      amount_cents: amountCents,
      status: "active",
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Email de confirmation (US-05), best-effort : ne bloque jamais la réponse.
  // On relit l'offre pour récupérer l'empreinte (amount_hash) et l'horodatage
  // posés par les triggers DB.
  if (user.email) {
    const { data: saved } = await supabase
      .rpc("my_bid_for_drop", { p_drop_id: dropId })
      .maybeSingle();
    const savedBid = saved as unknown as Tables<"bids"> | null;
    await sendBidConfirmation(user.email, {
      dropNumber: drop.drop_number ?? 0,
      title: drop.title ?? "votre pièce",
      amountCents,
      submittedAt: savedBid?.submitted_at ?? new Date().toISOString(),
      hash: savedBid?.amount_hash ?? null,
      dropId,
      imageUrl: drop.hero_image_url,
    });
  }

  return NextResponse.json({ ok: true, amountCents });
}
