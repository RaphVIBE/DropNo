/**
 * Cookie de consentement (ePrivacy/RGPD). Valeurs : "accepted" | "rejected".
 * Strictement nécessaire (mémorise le choix), donc exempt de consentement.
 * Tant qu'il est absent, on n'a posé aucun cookie non essentiel et la bannière
 * s'affiche. "accepted" autorise PostHog ; "rejected" le garde désactivé.
 */
export const CONSENT_COOKIE = "dropno-consent";

/** Durée du cookie de choix : 6 mois (recommandation CNIL/APD). */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;
