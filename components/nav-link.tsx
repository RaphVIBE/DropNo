"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Lien de navigation conscient de la route active. Souligne discretement
 * l'entree correspondant a la page courante (et marque aria-current pour
 * l'accessibilite). Actif aussi sur les sous-routes : « Maisons » reste
 * actif sur /marques/<slug>, « Calendrier » sur /drops.
 */
export function NavLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-sm border-b py-1 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        active
          ? "border-champagne-deep text-foreground"
          : "border-transparent text-ink-2 hover:text-foreground"
      } ${className}`}
    >
      {label}
    </Link>
  );
}
