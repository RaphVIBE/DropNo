import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Helpers de navigation locale-aware. À utiliser à la place de `next/link`
 * et `next/navigation` dans les routes localisées : ils ajoutent le préfixe
 * `/en` automatiquement (et rien pour le FR par défaut).
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
