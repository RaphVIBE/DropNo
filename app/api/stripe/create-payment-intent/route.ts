import { NextResponse, type NextRequest } from "next/server";

import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Cree un PaymentIntent en PRE-AUTORISATION (capture_method: manual) pour
 * sceller une offre. Le montant est capture par l'edge function close-drop
 * uniquement si l'offre gagne.
 *
 * Scaffold : la logique metier complete (lien au bid, ajustement sur
 * modification, contraintes KYC) est branchee au Prompt 3.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "non_authentifie" }, { status: 401 });
  }

  let body: { amountCents?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "corps_invalide" }, { status: 400 });
  }

  const amountCents = body.amountCents;
  if (!amountCents || !Number.isInteger(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: "montant_invalide" }, { status: 400 });
  }

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: amountCents,
    currency: "eur",
    capture_method: "manual",
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
