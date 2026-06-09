import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";
import { NavLink } from "@/components/nav-link";

/**
 * Navigation globale (chrome fixe). Reprend le wordmark serif du mockup.
 * Server Component : pas d'etat client necessaire.
 *
 * Mise en page :
 * - Desktop : une seule barre, liens inline a droite du logo.
 * - Mobile  : barre principale (logo + Se connecter) + une seconde barre
 *   subtile en dessous qui porte les liens, pour qu'aucune entree ne
 *   disparaisse sur petit ecran.
 */

const NAV_ITEMS = [
  { href: "/a-propos", label: "À propos" },
  { href: "/marques", label: "Maisons" },
  { href: "/drops", label: "Calendrier" },
];

export function SiteNav() {
  return (
    <header className="reveal-nav fixed inset-x-0 top-0 z-50 border-b border-rule-soft bg-background/85 backdrop-blur-md backdrop-saturate-150">
      {/* Barre principale — toujours visible */}
      <div className="flex items-center justify-between px-7 py-[18px]">
        <Link
          href="/"
          className="rounded-sm text-[22px] text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-7">
          {/* Liens inline — desktop uniquement (sur mobile ils passent
              dans la seconde barre ci-dessous). */}
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              className="hidden sm:inline-block"
            />
          ))}
          <Link
            href="/login"
            className="bg-primary px-[18px] py-[9px] text-xs font-medium uppercase tracking-wider text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Se connecter
          </Link>
        </nav>
      </div>

      {/* Seconde barre — mobile uniquement. Subtile : separateur fin,
          liens centres, fond legerement teinte. */}
      <nav className="flex items-center justify-center gap-9 border-t border-rule-soft/70 bg-card/40 px-7 py-2.5 sm:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>
    </header>
  );
}
