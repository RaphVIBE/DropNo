"use client";

import { useEffect } from "react";

import { clientLocale } from "@/lib/i18n/client-locale";

/**
 * Frontière d'erreur racine : ne se déclenche que si le layout racine lui-même
 * a crashé. Elle REMPLACE tout (y compris <html>/<body> et globals.css), donc
 * elle doit être totalement auto-suffisante : on n'importe ni police, ni token
 * Tailwind, ni provider i18n. Styles inline avec les couleurs du design system,
 * copy résolue par la langue du document avec repli pathname, navigation en
 * <a> nu (le helper Link next-intl exige un contexte ici absent).
 */

const COPY = {
  fr: {
    lang: "fr",
    title: "Une erreur est survenue.",
    lede: "Le site a rencontré un incident inattendu. Vos offres en cours restent enregistrées et valables. Rechargez la page pour reprendre.",
    reload: "Recharger la page",
    backHome: "Retour à l’accueil",
  },
  en: {
    lang: "en",
    title: "Something went wrong.",
    lede: "The site ran into an unexpected incident. Any bids you have placed remain saved and valid. Reload the page to continue.",
    reload: "Reload the page",
    backHome: "Back to home",
  },
} as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = COPY[clientLocale()];
  const homeHref = t.lang === "en" ? "/en" : "/";

  // Tokens du design system, en dur (la feuille de styles n'est pas garantie).
  const bg = "oklch(0.975 0.006 80)";
  const ink = "oklch(0.18 0.012 60)";
  const ink2 = "oklch(0.32 0.012 60)";
  const champagneDeep = "oklch(0.52 0.06 70)";
  const sansStack =
    'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const serifStack = 'Fraunces, Georgia, "Times New Roman", serif';

  return (
    <html lang={t.lang}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem 1.75rem",
          background: bg,
          color: ink,
          fontFamily: sansStack,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "oklch(0.72 0.07 80)",
          }}
        />
        <span
          translate="no"
          style={{
            fontFamily: serifStack,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "1.5rem",
            letterSpacing: "-0.01em",
            marginBottom: "2.5rem",
          }}
        >
          Drop <sup style={{ fontSize: "0.72em" }}>No.</sup>
        </span>
        <h1
          style={{
            fontFamily: serifStack,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(2.25rem, 8vw, 3.75rem)",
            lineHeight: 1,
            margin: 0,
            maxWidth: "32rem",
          }}
        >
          {t.title}
        </h1>
        <p
          style={{
            marginTop: "1.75rem",
            maxWidth: "28rem",
            fontSize: "1rem",
            lineHeight: 1.65,
            color: ink2,
          }}
        >
          {t.lede}
        </p>
        <div
          style={{
            marginTop: "2.5rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: 4,
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              fontFamily: sansStack,
              background: ink,
              color: bg,
            }}
          >
            {t.reload}
          </button>
          <a
            href={homeHref}
            style={{
              borderRadius: 4,
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: `1px solid ${ink}`,
              color: ink,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {t.backHome}
          </a>
        </div>
        <p style={{ marginTop: "3rem", fontSize: "0.875rem", color: ink2 }}>
          <a
            href="mailto:hello@dropno.eu"
            style={{ color: champagneDeep, textUnderlineOffset: "4px" }}
          >
            hello@dropno.eu
          </a>
        </p>
      </body>
    </html>
  );
}
