import Link from "next/link";

/**
 * Navigation globale (chrome fixe). Reprend le wordmark serif du mockup.
 * Server Component : pas d'etat client necessaire pour le scaffold.
 */
export function SiteNav() {
  return (
    <header className="reveal-nav fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-rule-soft bg-background/85 px-7 py-[18px] backdrop-blur-md backdrop-saturate-150">
      <Link
        href="/"
        translate="no"
        className="rounded-sm font-serif text-[22px] font-light italic tracking-tight text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Drop <sup className="align-super text-[0.8em]">No.</sup>
      </Link>
      <nav className="flex items-center gap-7">
        <Link
          href="/a-propos"
          className="hidden rounded-sm border-b border-transparent py-1 text-[13px] text-ink-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-block"
        >
          À propos
        </Link>
        <Link
          href="/marques"
          className="hidden rounded-sm border-b border-transparent py-1 text-[13px] text-ink-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-block"
        >
          Maisons
        </Link>
        <Link
          href="/drops"
          className="rounded-sm border-b border-transparent py-1 text-[13px] text-ink-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Calendrier
        </Link>
        <Link
          href="/login"
          className="bg-primary px-[18px] py-[9px] text-xs font-medium uppercase tracking-wider text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Se connecter
        </Link>
      </nav>
    </header>
  );
}
