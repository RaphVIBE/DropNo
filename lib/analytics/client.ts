"use client";

// Wrapper minimal autour du posthog global injecté par le snippet
// (components/analytics/PostHogScript). Le stub du snippet met en file les
// appels avant le chargement d'array.js : phCapture est donc safe très tôt.

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

export function phCapture(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    window.posthog?.capture(event, properties);
  } catch {
    // analytics best-effort, jamais bloquant
  }
}

/** Routes internes jamais trackées (opérateur, maisons, outils dev). */
export const isInternalPath = (pathname: string) =>
  pathname.startsWith("/admin") ||
  pathname.startsWith("/maison") ||
  pathname.startsWith("/dev-login") ||
  pathname.startsWith("/dev");
