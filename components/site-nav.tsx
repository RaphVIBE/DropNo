import Link from "next/link";

/**
 * Navigation globale (chrome fixe). Reprend le wordmark serif du mockup.
 * Server Component : pas d'etat client necessaire pour le scaffold.
 */
export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-rule-soft bg-background/85 px-7 py-[18px] backdrop-blur-md backdrop-saturate-150">
      <Link
        href="/"
        className="font-serif text-[22px] font-light italic tracking-tight text-foreground no-underline"
      >
        Drop <sup className="align-super text-[0.8em]">No.</sup>
      </Link>
      <nav className="flex items-center gap-7">
        <Link
          href="/drops"
          className="border-b border-transparent py-1 text-[13px] text-ink-2 transition-colors hover:text-foreground"
        >
          Calendrier
        </Link>
        <Link
          href="/login"
          className="bg-primary px-[18px] py-[9px] text-xs font-medium uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
        >
          Se connecter
        </Link>
      </nav>
    </header>
  );
}
