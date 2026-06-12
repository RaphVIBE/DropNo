import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { resolveLoginDest } from "@/lib/auth/finalize-login";

/**
 * Callback magic link. Echange le code contre une session, puis upsert la row
 * `profiles` (via resolveLoginDest) et redirige. Le code OTP saisi à la main
 * passe lui par `/auth/post-login` (session posée côté client).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const dest = await resolveLoginDest(searchParams.get("redirect"));

  return NextResponse.redirect(`${origin}${dest ?? "/login?error=auth"}`);
}
