"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Formulaire d'inscription à « La Liste » — l'accès anticipé aux drops (et non
 * une newsletter). Opt-in simple + consentement explicite (case obligatoire).
 * Poste vers /api/waitlist (inchangé : email, consent, source).
 *
 * `source` trace l'origine (home / footer). `compact` densifie le rendu pour
 * le pied de page. Au succès : confirmation « sceau » révélée par clip-path
 * (cf. .seal-reveal), dans l'esprit du reveal du prix de clôture.
 */
export function WaitlistForm({
  source,
  compact = false,
}: {
  source: string;
  compact?: boolean;
}) {
  const t = useTranslations("waitlist");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  // Honeypot anti-bot : un humain ne le remplit jamais (masqué visuellement).
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setStatus("error");
      setMessage(t("errorConsent"));
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, source, website }),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(
          data.error === "invalid_email" ? t("errorEmail") : t("errorGeneric")
        );
      }
    } catch {
      setStatus("error");
      setMessage(t("errorGeneric"));
    }
  }

  // Confirmation « sceau » : un filet champagne, puis le verdict révélé.
  if (status === "done") {
    return (
      <div role="status" aria-live="polite" className={compact ? "" : "text-center"}>
        <span
          aria-hidden="true"
          className="seal-reveal block h-px w-12 bg-[var(--champagne-deep)]"
          style={!compact ? { marginInline: "auto" } : undefined}
        />
        <p
          className={`seal-reveal font-display italic leading-[1.05] text-foreground ${
            compact ? "mt-4 text-2xl" : "mt-6 text-[clamp(1.9rem,4vw,2.9rem)]"
          }`}
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
        >
          {t("successTitle")}
        </p>
        <p
          className={`mt-3 text-ink-2 ${compact ? "text-sm" : "mx-auto max-w-[40ch] text-base leading-relaxed"}`}
        >
          {t("successBody")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      {/* Honeypot : invisible, hors tabulation, masqué aux AT. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>
      <div className={compact ? "flex gap-2" : "flex flex-col gap-3 sm:flex-row"}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="w-full rounded-sm border border-input bg-card px-4 py-3 text-base outline-none transition-colors focus:border-champagne-deep focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          aria-busy={status === "sending"}
          className="shrink-0 whitespace-nowrap bg-primary px-6 py-3 text-xs font-medium uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          {status === "sending" ? t("submitting") : t("submit")}
        </button>
      </div>
      <label className="flex cursor-pointer select-none items-start gap-2.5 text-xs leading-relaxed text-ink-2">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-input accent-[oklch(0.72_0.07_80)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {t("consent")}
      </label>
      {status === "error" ? (
        <p className="text-sm text-destructive">{message}</p>
      ) : null}
    </form>
  );
}
