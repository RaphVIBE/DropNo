import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";
import { constructionGate } from "@/lib/construction-gate";

const handleI18n = createMiddleware(routing);

// Préfixes NON localisés : back-office (FR only) + route handlers. La locale
// n'y est pas routée ; on n'y fait tourner que la session Supabase.
const NON_LOCALIZED = ["/admin", "/maison", "/api", "/auth"];

export async function middleware(request: NextRequest) {
  // Barrière "site en construction" (avant tout le reste).
  const gated = constructionGate(request);
  if (gated) return gated;

  const { pathname } = request.nextUrl;
  const isNonLocalized = NON_LOCALIZED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // 1) Routage i18n (sauf zones non localisées) : peut rediriger pour ajouter/
  //    retirer le préfixe /en et pose le cookie NEXT_LOCALE.
  const response = isNonLocalized
    ? NextResponse.next({ request })
    : handleI18n(request);

  // Redirection locale → on la renvoie telle quelle (pas de session à poser).
  if (response.headers.get("location")) {
    return response;
  }

  // 2) Rafraîchit la session Supabase en écrivant ses cookies sur `response`.
  return updateSession(request, response);
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - _next/static, _next/image
     * - favicon.ico, fichiers d'images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
