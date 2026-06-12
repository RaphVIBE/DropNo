import { NextResponse, type NextRequest } from "next/server";

import { resolveLoginDest } from "@/lib/auth/finalize-login";

/**
 * Finalisation du flux code OTP. Le code à six chiffres est vérifié côté client
 * (`verifyOtp`), ce qui pose la session dans les cookies ; cette route lit cette
 * session pour upsert le profil et router vers la bonne destination. Si aucune
 * session n'est présente (cookie non posé, expiration), retour au login.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const dest = await resolveLoginDest(searchParams.get("redirect"));

  return NextResponse.redirect(`${origin}${dest ?? "/login?error=auth"}`);
}
