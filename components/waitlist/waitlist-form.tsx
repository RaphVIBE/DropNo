"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Formulaire de liste d'attente (soft launch). Opt-in simple + consentement
 * marketing explicite (case obligatoire). Poste vers /api/waitlist.
 *
 * `source` trace l'origine (home / footer). `compact` densifie le rendu pour
 * le pied de page.
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
        body: JSON.stringify({ email, consent, source }),
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

  if (status === "done") {
    return (
      <p
        className={`text-ink-2 ${compact ? "text-sm" : "text-base leading-relaxed"}`}
        role="status"
      >
        {t("success")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div className={compact ? "flex gap-2" : "flex flex-col gap-3 sm:flex-row"}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="w-full border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 whitespace-nowrap bg-primary px-6 py-3 text-xs font-medium uppercase tracking-wider text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
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
