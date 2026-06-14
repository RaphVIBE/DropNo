/*
 * Classes de marque partagées — centralise les valeurs oklch « magiques »
 * dupliquées entre cartes et visuels produit. Ce fichier vit sous components/
 * pour que Tailwind scanne les classes (le glob `content` n'inclut pas lib/).
 */

/**
 * Cadre sombre d'une pièce (visuel produit) : fond brun, ring discret, coins
 * arrondis. L'ombre portée varie selon le contexte — l'ajouter au cas par cas.
 */
export const PIECE_FRAME =
  "rounded-xl bg-[oklch(0.16_0.012_60)] ring-1 ring-rule-soft";

/**
 * CTA visuel d'une carte entièrement cliquable (la carte est le lien) :
 * pastille pleine qui passe au champagne au survol de la carte (group-hover).
 * Le padding est ajouté au cas par cas.
 */
export const CARD_CTA =
  "inline-flex w-fit items-center gap-2 rounded-sm bg-primary text-xs font-medium uppercase tracking-wider text-primary-foreground transition-colors group-hover:bg-[var(--btn-hover)]";
