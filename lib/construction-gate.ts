import { NextResponse, type NextRequest } from "next/server";

/**
 * Barrière "site en construction".
 *
 * Tant que SITE_LOCKED == "true", tout le site visiteur affiche la page
 * /bientot — SAUF :
 *  - la page /bientot elle-même et les assets Next ;
 *  - les routes /api/* (webhooks Stripe, cron notifications : protégées par
 *    leurs propres secrets, doivent rester accessibles) ;
 *  - les visiteurs munis du cookie de preview.
 *
 * Accès équipe : visiter `/?preview=<PREVIEW_TOKEN>` pose un cookie longue
 * durée et débloque le vrai site. PREVIEW_TOKEN est un secret serveur.
 *
 * Retourne une NextResponse si la requête doit être interceptée, sinon null
 * (la requête continue son chemin normal).
 */
const PREVIEW_COOKIE = "dropno_preview";

export function constructionGate(request: NextRequest): NextResponse | null {
  if (process.env.SITE_LOCKED !== "true") return null;

  const { pathname, searchParams } = request.nextUrl;

  // Toujours laisser passer : page bientôt, assets, robots, API (auth propre).
  if (
    pathname === "/bientot" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") || // back-office : protégé par auth + rôle, hors vitrine
    pathname.startsWith("/maison") || // espace responsables maison : protégé par auth + rôle
    pathname === "/dev-login" || // connexion dev par mot de passe (désactivée en prod)
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico"
  ) {
    return null;
  }

  // Re-verrouiller : ?preview=off retire le cookie et renvoie sur /bientot.
  const preview = searchParams.get("preview");
  if (preview === "off") {
    const url = request.nextUrl.clone();
    url.pathname = "/bientot";
    url.searchParams.delete("preview");
    const res = NextResponse.redirect(url);
    res.cookies.set(PREVIEW_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  // Bypass équipe via ?preview=TOKEN -> pose le cookie puis nettoie l'URL.
  const token = process.env.PREVIEW_TOKEN;
  if (token && preview && preview === token) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("preview");
    const res = NextResponse.redirect(clean);
    res.cookies.set(PREVIEW_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 jours
    });
    return res;
  }

  // Cookie de preview présent -> accès complet au vrai site.
  if (request.cookies.get(PREVIEW_COOKIE)?.value === "1") return null;

  // Sinon -> on sert la page /bientot (URL conservée) + noindex.
  const url = request.nextUrl.clone();
  url.pathname = "/bientot";
  const res = NextResponse.rewrite(url);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
