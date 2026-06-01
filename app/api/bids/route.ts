import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
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
 * Stripe : on cree un PaymentIntent en capture manuelle (pre-autorisation).
 * La collecte/confirmation de la carte (Stripe Elements) est l'etape suivante ;
 * sans STRIPE_SECRET_KEY on enregistre l'offre avec stripe_auth_status='pending'.
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
    .select("status, floor_price_cents, bid_lock_at, title, drop_number")
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

  // Pre-autorisation Stripe (capture manuelle).
  let paymentIntentId = existing?.stripe_payment_intent_id ?? null;
  let authStatus = "pending";
  if (process.env.STRIPE_SECRET_KEY) {
    const stripe = getStripe();
    if (existing?.stripe_payment_intent_id) {
      // Modification : on annule l'ancienne pre-auth avant d'en recreer une.
      try {
        await stripe.paymentIntents.cancel(existing.stripe_payment_intent_id);
      } catch {
        // deja annulee/capturee : on ignore.
      }
    }
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      capture_method: "manual",
      metadata: { drop_id: dropId, user_id: user.id, kind: "sealed_bid" },
    });
    paymentIntentId = pi.id;
    authStatus = pi.status; // requires_payment_method tant que la carte n'est pas confirmee
  }

  // Upsert de l'offre via la session RLS de l'utilisateur.
  if (existing) {
    const { error } = await supabase
      .from("bids")
      .update({
        amount_cents: amountCents,
        stripe_payment_intent_id: paymentIntentId,
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
      stripe_payment_intent_id: paymentIntentId,
      stripe_auth_status: authStatus,
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
    });
  }

  return NextResponse.json({ ok: true, amountCents });
}
