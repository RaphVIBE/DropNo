import { defineRouting } from "next-intl/routing";

/**
 * Routing i18n. FR = défaut élégant servi à la racine (pas de préfixe) ;
 * EN = international, préfixé `/en`. `as-needed` : seules les URLs EN portent
 * le préfixe, les URLs FR existantes restent inchangées.
 *
 * Détection : cookie `NEXT_LOCALE` (préférence) puis `Accept-Language`.
 * Le cookie est fonctionnel (préférence linguistique posée sur action) —
 * à documenter dans /legal/politique-cookies.
 */
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365, // 1 an
    sameSite: "lax",
  },
});

export type Locale = (typeof routing.locales)[number];
