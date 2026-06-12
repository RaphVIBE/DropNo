"use client";

import { useLocale } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Sélecteur de langue FR / EN. Rejoue le chemin courant dans l'autre locale
 * (next-intl pose le préfixe /en si besoin et le cookie NEXT_LOCALE).
 */
export function LocaleSwitcher() {
  const active = useLocale();
  const pathname = usePathname();
  const router = useRouter();

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
            onClick={() => {
              // <html> est rendu à la racine (au-dessus de [locale]) : il ne se
              // re-rend pas en nav douce. On synchronise lang ici pour l'a11y/SEO.
              document.documentElement.lang = locale;
              router.replace(pathname, { locale });
            }}
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
