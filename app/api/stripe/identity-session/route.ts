import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/**
 * Démarre une vérification Stripe Identity (KYC acheteur, US-26), déclenchée
 * au premier bid. Renvoie l'URL hébergée Stripe vers laquelle rediriger.
 *
 * Le webhook `identity.verification_session.verified` (Prompt 4) bascule
 * profiles.kyc_status vers 'verified'. Ici on passe en 'verifying'.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Vérification d'identité indisponible (Stripe non configuré)." },
      { status: 503 }
    );
  }

  let dropId: string | undefined;
  try {
    dropId = (await request.json())?.dropId;
  } catch {
    // body optionnel
  }

  const origin = request.nextUrl.origin;
  const returnUrl = dropId ? `${origin}/drop/${dropId}` : `${origin}/account/dashboard`;

  const stripe = getStripe();
  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: { user_id: user.id },
    return_url: returnUrl,
  });

  // Trace le statut côté profil (RLS : update sa propre row).
  await supabase
    .from("profiles")
    .update({
      kyc_status: "verifying",
      kyc_stripe_session_id: session.id,
    })
    .eq("id", user.id);

  return NextResponse.json({ url: session.url });
}
