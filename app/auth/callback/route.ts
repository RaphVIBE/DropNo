import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Callback magic link. Echange le code OAuth contre une session, puis
 * upsert la row `profiles` si nouvel utilisateur, et redirige.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect") ?? "/account/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Upsert du profil (idempotent). RLS : l'utilisateur ne touche que sa row.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from("profiles")
      .upsert(
        { id: user.id, email: user.email ?? "" },
        { onConflict: "id", ignoreDuplicates: true }
      );
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
