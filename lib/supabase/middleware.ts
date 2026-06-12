import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./types";
import { SESSION_ONLY_COOKIE, withPersistence } from "./cookie-persistence";

/** Routes necessitant une session authentifiee (hors prefixe de locale). */
const PROTECTED_PREFIXES = ["/account", "/admin", "/maison"];

/** Retire un eventuel prefixe de locale (/en) pour tester le chemin "nu". */
function stripLocale(pathname: string): string {
  return pathname.replace(/^\/en(?=\/|$)/, "") || "/";
}

/**
 * Rafraichit la session Supabase a chaque requete et redirige vers /login
 * les acces non authentifies aux routes protegees. Ecrit ses cookies sur la
 * `response` fournie (issue du middleware i18n) pour ne pas ecraser le cookie
 * de locale ni une eventuelle reecriture.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
) {
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

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const sessionOnly =
            request.cookies.get(SESSION_ONLY_COOKIE)?.value === "1";
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(
              name,
              value,
              withPersistence(value, options, sessionOnly)
            )
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
  const bare = stripLocale(pathname);
  const isProtected = PROTECTED_PREFIXES.some((p) => bare.startsWith(p));

  if (isProtected && !user) {
    // Redirige vers /login en conservant la locale courante (/en/login si EN).
    const localePrefix =
      pathname === "/en" || pathname.startsWith("/en/") ? "/en" : "";
    const url = request.nextUrl.clone();
    url.pathname = `${localePrefix}/login`;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
