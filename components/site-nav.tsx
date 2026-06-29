import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { NavLink } from "@/components/nav-link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { MobileNav } from "@/components/mobile-nav";

/**
 * Navigation globale (chrome fixe). Reprend le wordmark serif du mockup.
 *
 * Mise en page :
 * - Desktop (>= sm) : une seule barre, liens inline a droite du logo,
 *   switch de langue et bouton « Se connecter ».
 * - Mobile (< sm)  : barre fine (wordmark centré, hamburger à droite) qui
 *   ouvre un overlay plein écran (cf. <MobileNav />). Toutes les entrées —
 *   nav principale, langue, connexion, contact — vivent dans l'overlay.
 */

export async function SiteNav() {
  const t = await getTranslations("nav");
  // « Lire » ne figure plus dans la nav principale : les essais sont repliés en
  // annexe au bas de la page « À propos ». La route /lire reste accessible en
  // direct (liens existants, SEO).
  const navItems = [
    { href: "/drops", label: t("calendar") },
    { href: "/marques", label: t("houses") },
    { href: "/mecanisme", label: t("mechanism") },
    { href: "/a-propos", label: t("about") },
  ];

  return (
    <header className="reveal-nav fixed inset-x-0 top-0 z-50 border-b border-rule-soft bg-background/85 backdrop-blur-md backdrop-saturate-150">
      <div className="flex items-center justify-between px-7 py-[18px]">
        <Link
          href="/"
          className="rounded-sm text-[22px] text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Wordmark />
        </Link>

        {/* Desktop : nav inline + langue + CTA. Masqué sur mobile. */}
        <nav className="hidden items-center gap-7 sm:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
          <span className="flex">
            <LocaleSwitcher />
          </span>
          <Link
            href="/login"
            className="bg-primary px-[18px] py-[9px] text-xs font-medium uppercase tracking-wider text-primary-foreground transition-colors rounded-sm hover:bg-[var(--btn-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("signIn")}
          </Link>
        </nav>

        {/* Mobile : déclencheur + overlay plein écran. Masqué dès sm. */}
        <div className="sm:hidden">
          <MobileNav
            navItems={navItems}
            labels={{
              open: t("openMenu"),
              close: t("closeMenu"),
              menu: t("menuLabel"),
              primaryNav: t("primaryNav"),
              signIn: t("signIn"),
              contact: t("contact"),
              language: t("language"),
              utilityTitle: t("utilityTitle"),
            }}
          />
        </div>
      </div>
    </header>
  );
}
