import type { ReactNode } from "react";

import {
  HeroBlueprint,
  type HeroBlueprintVariant,
} from "@/components/brand/hero-blueprints";
import { Wordmark } from "@/components/brand/wordmark";

/**
 * Coque visuelle commune aux pages d'erreur et de maintenance du site vitrine.
 *
 * Présentationnelle : ne consomme NI hook NI contexte i18n. Toute la copy
 * arrive par props (chaînes déjà traduites), ce qui permet de la rendre aussi
 * bien depuis un composant serveur (not-found) que client (error.tsx). Elle
 * reprend la langue visuelle du Masthead (bande sable + filigrane blueprint en
 * thème clair) mais reste auto-suffisante : aucune dépendance à la nav/footer,
 * pour rester robuste même quand un layout a échoué.
 *
 * `withWordmark` affiche le mot-marque en tête (utile quand la coque n'est pas
 * rendue sous la nav du site, p. ex. la page maintenance plein écran).
 */
export function ErrorShell({
  variant = "movement",
  code,
  eyebrow,
  title,
  lede,
  children,
  withWordmark = false,
}: {
  variant?: HeroBlueprintVariant;
  code?: string;
  eyebrow: string;
  title: string;
  lede: string;
  children?: ReactNode;
  withWordmark?: boolean;
}) {
  return (
    <section className="relative isolate flex min-h-[70vh] flex-col items-center justify-center overflow-hidden border-b border-rule-soft bg-masthead px-7 py-24 text-center md:px-16 md:py-32">
      {/* Filigrane technique, très discret, identique au Masthead. */}
      <div
        className="reveal-art pointer-events-none absolute inset-0 z-0 text-champagne-deep"
        style={{ "--art-opacity": 0.05 } as React.CSSProperties}
        aria-hidden
      >
        <HeroBlueprint variant={variant} />
      </div>

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center">
        {withWordmark ? (
          <Wordmark className="mb-10 text-2xl text-foreground" />
        ) : null}

        {code ? (
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-champagne-deep">
            {code}
          </span>
        ) : null}

        <p className="mt-3 text-xs uppercase tracking-[0.28em] text-ink-2">
          {eyebrow}
        </p>

        <h1 className="font-display mt-5 text-[clamp(2.5rem,8vw,4.5rem)] font-light leading-[0.98]">
          {title}
        </h1>

        <p className="mt-7 max-w-md text-base leading-relaxed text-ink-2">
          {lede}
        </p>

        {children ? (
          <div className="mt-11 flex w-full flex-col items-center gap-4">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
