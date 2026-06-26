import { NextResponse, type NextRequest } from "next/server";

/**
 * Barrière "maintenance" (503).
 *
 * Tant que SITE_MAINTENANCE == "true", tout le site visiteur affiche la page
 * /maintenance avec un statut HTTP 503 (Service Unavailable) + en-tête
 * Retry-After, SAUF :
 *  - la page /maintenance elle-même et les assets Next ;
 *  - les routes /api/* (webhooks Stripe, crons de clôture/notifications :
 *    doivent continuer à tourner pendant une maintenance vitrine) ;
 *  - le back-office /admin et l'espace /maison (protégés par auth, on veut
 *    pouvoir piloter le site PENDANT la maintenance) et /auth, /dev-login ;
 *  - les membres de l'équipe munis du cookie de preview (mêmes que la barrière
 *    "bientôt") : ils peuvent vérifier le site avant de relever la barrière.
 *
 * Bascule : poser la variable d'environnement SITE_MAINTENANCE=true (Vercel →
 * Project Settings → Environment Variables, puis redeploy ou simple toggle).
 * La remettre à false (ou la supprimer) rétablit le site. Aucune écriture en
 * base, aucun build : le toggle est instantané et réversible.
 *
 * Important : on N'INTERROMPT PAS les offres. Le mode coupe l'accès au front,
 * la copy de /maintenance rassure que les bids restent enregistrés et valables.
 *
 * Retourne une NextResponse 503 si la requête doit être interceptée, sinon null.
 */
const PREVIEW_COOKIE = "dropno_preview";

export function maintenanceGate(request: NextRequest): NextResponse | null {
  if (process.env.SITE_MAINTENANCE !== "true") return null;

  const { pathname } = request.nextUrl;

  // Cible de réécriture localisée (Next n'a pas de route /maintenance nu).
  const maintenancePath = pathname.startsWith("/en")
    ? "/en/maintenance"
    : "/fr/maintenance";

  // Toujours laisser passer : page maintenance, assets, API, back-office, auth.
  if (
    pathname === "/maintenance" ||
    pathname === "/fr/maintenance" ||
    pathname === "/en/maintenance" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maison") ||
    pathname.startsWith("/auth") ||
    pathname === "/dev-login" ||
    pathname === "/en/dev-login" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico"
  ) {
    return null;
  }

  // Équipe : le cookie de preview (posé par ?preview=TOKEN) laisse passer afin
  // de vérifier le site avant de relever la barrière.
  if (request.cookies.get(PREVIEW_COOKIE)?.value === "1") return null;

  // Sinon : on sert /maintenance (URL conservée) en 503 + Retry-After + noindex.
  const url = request.nextUrl.clone();
  url.pathname = maintenancePath;
  const res = NextResponse.rewrite(url, { status: 503 });
  res.headers.set("Retry-After", "3600");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
