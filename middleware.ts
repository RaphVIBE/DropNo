import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";
import { constructionGate } from "@/lib/construction-gate";
import { maintenanceGate } from "@/lib/maintenance-gate";

const handleI18n = createMiddleware(routing);

/**
 * Force la locale que next-intl va négocier sur `request`, en posant le cookie
 * `NEXT_LOCALE` (prioritaire sur Accept-Language dans la détection next-intl).
 * Mute la requête en place : `request.cookies` est modifiable en middleware.
 * Utilisé pour ancrer la langue des pages démo sur le préfixe d'URL plutôt que
 * sur le navigateur du destinataire.
 */
function pinLocale(request: NextRequest, locale: string): void {
  request.cookies.set("NEXT_LOCALE", locale);
}

// Préfixes NON localisés : back-office (FR only) + route handlers. La locale
// n'y est pas routée ; on n'y fait tourner que la session Supabase.
const NON_LOCALIZED = ["/admin", "/maison", "/api", "/auth"];

export async function middleware(request: NextRequest) {
  // Barrière "maintenance" (503) : prioritaire sur tout le reste. Coupe le
  // front visiteur, préserve /admin · /maison · /api pour piloter pendant.
  const maintenance = maintenanceGate(request);
  if (maintenance) return maintenance;

  // Barrière "site en construction" (avant tout le reste, hors maintenance).
  const gated = constructionGate(request);
  if (gated) return gated;

  const { pathname } = request.nextUrl;
  const isNonLocalized = NON_LOCALIZED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Pages démo prospect : la langue est ANCRÉE sur l'URL, jamais négociée.
  //   /demo/<slug>      -> toujours FR (racine, défaut servi sans préfixe)
  //   /en/demo/<slug>   -> toujours EN
  // En `as-needed`, l'URL FR n'a pas de préfixe : next-intl négocie alors la
  // locale via le cookie NEXT_LOCALE / Accept-Language. Un même lien démo
  // partagé à une maison basculait donc de langue selon le navigateur du
  // destinataire (« Bientôt dévoilé » servi en FR là où l'EN était attendu).
  // On neutralise la négociation en forçant le cookie NEXT_LOCALE sur la
  // locale du préfixe d'URL avant de passer la main à next-intl.
  const demoLocale =
    pathname === "/en/demo" || pathname.startsWith("/en/demo/")
      ? "en"
      : pathname === "/demo" || pathname.startsWith("/demo/")
        ? "fr"
        : null;
  if (demoLocale) pinLocale(request, demoLocale);

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
     * - robots.txt / sitemap.xml / og-default.png : métadonnées SEO servies
     *   par leurs route handlers, jamais localisées (sinon i18n → 404).
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|og-default.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
