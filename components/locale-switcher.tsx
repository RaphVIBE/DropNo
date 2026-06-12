"use client";

import { useLocale } from "next-intl";

import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Sélecteur de langue FR / EN. Rejoue le chemin courant dans l'autre locale
 * (next-intl pose le préfixe /en si besoin et le cookie NEXT_LOCALE).
 */
export function LocaleSwitcher() {
  const active = useLocale();
  const pathname = usePathname();

  // Bascule de langue. On pose le cookie (il prime sur Accept-Language au
  // middleware) PUIS on fait une navigation DURE vers l'URL cible : une nav
  // douce laisserait les liens du chrome (rendus dans le layout) pointer vers
  // l'ancienne locale, et cliquer dessus rebasculerait via le préfixe d'URL.
  function switchTo(locale: string) {
    if (locale === active) return;
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;samesite=lax`;
    const base = pathname === "/" ? "" : pathname;
    const target =
      locale === routing.defaultLocale ? base || "/" : `/${locale}${base}`;
    window.location.assign(target);
  }

  return (
    <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider">
      {routing.locales.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 ? (
            <span aria-hidden className="text-rule">
              /
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => switchTo(locale)}
            aria-current={locale === active ? "true" : undefined}
            className={`rounded-sm px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              locale === active
                ? "text-foreground"
                : "text-ink-2 hover:text-foreground"
            }`}
          >
            {locale}
          </button>
        </span>
      ))}
    </div>
  );
}
