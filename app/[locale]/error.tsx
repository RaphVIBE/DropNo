"use client";

import { useEffect } from "react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ErrorShell } from "@/components/error/error-shell";
import { clientLocale } from "@/lib/i18n/client-locale";

/**
 * Frontière d'erreur runtime du segment localisé (500). Composant client (le
 * contrat Next exige `reset`) : il ne peut pas lire l'i18n serveur, donc la copy
 * vient d'un petit dictionnaire local résolu via la langue du <html> (posée par
 * le layout racine) avec repli pathname. Le layout reste monté autour : nav et
 * footer s'affichent toujours, on n'injecte que la coque d'erreur.
 */

const COPY = {
  fr: {
    eyebrow: "Incident technique",
    title: "Quelque chose s’est interrompu.",
    lede: "Une erreur inattendue est survenue de notre côté. Vos offres en cours restent enregistrées et valables. Réessayez dans un instant.",
    digest: "Référence de l’incident",
    tryAgain: "Réessayer",
    backHome: "Retour à l’accueil",
    contactPrompt: "Besoin d’aide ?",
  },
  en: {
    eyebrow: "Technical incident",
    title: "Something stopped short.",
    lede: "An unexpected error happened on our side. Any bids you have placed remain saved and valid. Please try again in a moment.",
    digest: "Incident reference",
    tryAgain: "Try again",
    backHome: "Back to home",
    contactPrompt: "Need a hand?",
  },
} as const;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Journalise pour la console / l'observabilité côté client.
    console.error(error);
  }, [error]);

  const t = COPY[clientLocale()];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="pt-[124px] outline-none sm:pt-[72px]"
    >
      <ErrorShell
        variant="escapement"
        eyebrow={t.eyebrow}
        title={t.title}
        lede={t.lede}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => reset()}>{t.tryAgain}</Button>
          <Button asChild variant="outline">
            <Link href="/">{t.backHome}</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t.contactPrompt}{" "}
          <a
            href="mailto:hello@dropno.eu"
            className="text-champagne-deep underline-offset-4 hover:underline"
          >
            hello@dropno.eu
          </a>
        </p>
        {error.digest ? (
          <p className="text-xs text-ink-2">
            {t.digest}: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </ErrorShell>
    </main>
  );
}
