import type { ReactNode } from "react";

import {
  HeroBlueprint,
  type HeroBlueprintVariant,
} from "@/components/brand/hero-blueprints";

/**
 * En-tête de page unifié du site vitrine. Chaque page s'ouvre sur cette bande :
 * une teinte sable un peu plus foncée que le fond (`--masthead`), un filigrane
 * technique propre à la page qui remplit le fond très discrètement, puis le
 * contenu. Reste en thème clair (encre normale) — seule la couleur de bande et
 * le filigrane changent.
 *
 * - `variant`  : le diagramme blueprint (movement, escapement, atelier…).
 * - `padding`  : padding du contenu (chaque page garde son rythme vertical).
 * - `className`: ajouts sur la <section>.
 * - `artOpacity`: opacité du filigrane (défaut très léger).
 */
export function Masthead({
  variant,
  children,
  padding = "px-7 pb-14 pt-20 md:px-16 md:pb-16 md:pt-24",
  className = "",
  artOpacity = 0.09,
}: {
  variant: HeroBlueprintVariant;
  children: ReactNode;
  padding?: string;
  className?: string;
  artOpacity?: number;
}) {
  return (
    <section
      className={`relative isolate overflow-hidden border-b border-rule-soft bg-masthead ${className}`}
    >
      {/* Filigrane technique : remplit le fond, très léger, ancré à droite. */}
      <div
        className="reveal-art pointer-events-none absolute inset-0 z-0 text-champagne-deep"
        style={{ "--art-opacity": artOpacity } as React.CSSProperties}
        aria-hidden
      >
        <HeroBlueprint variant={variant} />
      </div>
      <div className={`relative z-10 ${padding}`}>{children}</div>
    </section>
  );
}
