import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./types";

/** Routes necessitant une session authentifiee. */
const PROTECTED_PREFIXES = ["/account", "/admin", "/maison"];

/**
 * Rafraichit la session Supabase a chaque requete et redirige vers /login
 * les acces non authentifies aux routes protegees.
 */
export async function updateSession(request: NextRequest) {
  // Filet de securite : Supabase retombe parfois sur le Site URL (la racine)
  // au lieu du emailRedirectTo si /auth/callback n'est pas dans la liste
  // blanche des Redirect URLs. On rattrape le code OAuth et on le renvoie
  // vers le handler de callback.
  const { pathname: incomingPath, searchParams } = request.nextUrl;
  if (incomingPath === "/" && searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }
  // Lien magique rejete par Supabase (expire, deja consomme, invalide) :
  // GoTrue retombe sur la racine avec ?error=... On renvoie vers /login pour
  // afficher un message lisible plutot que la home muette.
  if (incomingPath === "/" && searchParams.has("error")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?auth_error=${searchParams.get("error_code") ?? searchParams.get("error") ?? "unknown"}`;
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT : ne rien executer entre createServerClient et getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
