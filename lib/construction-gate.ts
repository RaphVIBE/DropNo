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
 * Accès démo prospect : `/demo/<slug>?key=<DEMO_KEY>` est une page autonome
 * (app/[locale]/demo/[slug]) laissée passer ci-dessous. Elle vérifie la clé
 * elle-même et n'a aucune navigation sortante, donc le prospect ne retombe
 * jamais sur « bientôt ».
 *
 * Retourne une NextResponse si la requête doit être interceptée, sinon null
 * (la requête continue son chemin normal).
 */
const PREVIEW_COOKIE = "dropno_preview";

/**
 * Pages publiques laissées passer même site verrouillé : documents légaux
 * (catalogue `/legal/*` + slugs attendus par Stripe Connect) et page contact.
 * Stripe doit pouvoir crawler ces URLs publiquement pendant l'onboarding ;
 * il est par ailleurs sain que ces pages restent accessibles en soft-launch.
 */
const PUBLIC_LEGAL_PATHS = [
  "/legal",
  "/privacy-policy",
  "/confidentialite",
  "/terms-of-service",
  "/cgu",
  "/cgv",
  "/cookies",
  "/retractation",
  "/mentions-legales",
  "/contact",
];

function isPublicLegalPath(pathname: string): boolean {
  // Retire un éventuel préfixe de locale (`/en`, ou `/fr` explicite — la FR est
  // servie à la racine, mais `/fr/...` doit rester laissé passer pour que
  // next-intl le redirige ensuite vers l'URL nue plutôt que vers « bientôt »).
  const p = pathname.replace(/^\/(en|fr)(?=\/|$)/, "") || "/";
  return PUBLIC_LEGAL_PATHS.some((base) => p === base || p.startsWith(base + "/"));
}

export function constructionGate(request: NextRequest): NextResponse | null {
  if (process.env.SITE_LOCKED !== "true") return null;

  const { pathname, searchParams } = request.nextUrl;

  // Depuis l'i18n, la page « bientôt » vit sous [locale] (/fr/bientot, /en/…).
  // La cible de réécriture/redirection DOIT être préfixée, sinon Next ne trouve
  // pas de route à `/bientot` nu et renvoie 404.
  const bientotPath = pathname.startsWith("/en") ? "/en/bientot" : "/fr/bientot";

  // Toujours laisser passer : page bientôt (toutes locales), assets, robots, API.
  if (
    pathname === "/bientot" ||
    pathname === "/fr/bientot" ||
    pathname === "/en/bientot" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/demo") || // démo prospect (FR) : page autonome gated par clé
    pathname.startsWith("/en/demo") || // démo prospect (EN)
    pathname.startsWith("/admin") || // back-office : protégé par auth + rôle, hors vitrine
    pathname.startsWith("/maison") || // espace responsables maison : protégé par auth + rôle
    pathname === "/dev-login" || // connexion dev par mot de passe (désactivée en prod)
    pathname === "/en/dev-login" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    isPublicLegalPath(pathname) // légal + contact : crawlables par Stripe
  ) {
    return null;
  }

  // Re-verrouiller : ?preview=off retire le cookie et renvoie sur /bientot.
  const preview = searchParams.get("preview");
  if (preview === "off") {
    const url = request.nextUrl.clone();
    url.pathname = bientotPath;
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

  // Sinon -> on sert la page « bientôt » localisée (URL conservée) + noindex.
  const url = request.nextUrl.clone();
  url.pathname = bientotPath;
  const res = NextResponse.rewrite(url);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
