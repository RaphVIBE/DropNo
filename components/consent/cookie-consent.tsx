"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { CONSENT_COOKIE, CONSENT_MAX_AGE } from "@/lib/consent";

/**
 * Bannière de consentement cookies (ePrivacy/RGPD). N'apparaît que si aucun
 * choix n'est encore enregistré. « Refuser » est aussi accessible que
 * « Accepter » (exigence APD/CNIL). Seul l'analytics (PostHog) est concerné :
 * accepter ré-injecte le snippet côté serveur (reload) ; refuser le laisse off.
 */
export function CookieConsent() {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const decided = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${CONSENT_COOKIE}=`));
    setVisible(!decided);
  }, []);

  if (!visible) return null;

  function decide(value: "accepted" | "rejected") {
    document.cookie = `${CONSENT_COOKIE}=${value};path=/;max-age=${CONSENT_MAX_AGE};samesite=lax`;
    if (value === "accepted") {
      // Le snippet PostHog est rendu côté serveur en fonction du cookie :
      // un reload l'injecte maintenant que le consentement est posé.
      window.location.reload();
    } else {
      setVisible(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label={t("title")}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl border border-rule bg-card/95 p-5 shadow-lg backdrop-blur-sm md:inset-x-auto md:left-6 md:bottom-6 md:p-6"
    >
      <p className="text-sm leading-relaxed text-ink-2">
        {t("body")}{" "}
        <Link
          href="/legal/politique-cookies"
          className="rounded-sm text-foreground underline underline-offset-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("learnMore")}
        </Link>
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => decide("rejected")}
          className="flex-1 border border-input bg-background px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-ink-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("refuse")}
        </button>
        <button
          type="button"
          onClick={() => decide("accepted")}
          className="flex-1 bg-primary px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-primary-foreground transition-colors rounded-sm hover:bg-[var(--btn-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
