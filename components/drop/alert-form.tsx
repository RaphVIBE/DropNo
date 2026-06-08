"use client";

import { useState } from "react";
import { BellRing, Check } from "lucide-react";

const CTA_CLASS =
  "mt-5 block w-full bg-primary px-6 py-[16px] text-center text-[13px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Alerte montre sans compte : email + choix des rappels (ouverture / dernière
 * heure). Double opt-in : un email de confirmation est envoyé, l'alerte n'est
 * armée qu'au clic. `flash` rend les retours de confirmation/désinscription.
 */
export function AlertForm({
  dropId,
  status,
  flash,
}: {
  dropId: string;
  status: string;
  flash?: string;
}) {
  const [email, setEmail] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(status === "scheduled");
  const [notifyLock, setNotifyLock] = useState(true);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const flashMsg =
    flash === "confirmed"
      ? "Alerte confirmée. Vous serez prévenu par email."
      : flash === "off"
        ? "Vous ne recevrez plus d'alerte pour ce drop."
        : flash === "invalid"
          ? "Ce lien d'alerte n'est plus valide."
          : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyOpen && !notifyLock) {
      setState("error");
      setMessage("Choisissez au moins un rappel.");
      return;
    }
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dropId, email, notifyOpen, notifyLock }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Une erreur est survenue.");
        return;
      }
      setState("sent");
    } catch {
      setState("error");
      setMessage("Impossible de joindre le serveur.");
    }
  }

  return (
    <div className="mt-8 border border-rule bg-card p-7">
      <div className="mb-4 flex items-center gap-2">
        <BellRing className="size-4 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Me tenir informé
        </span>
      </div>

      {flashMsg ? (
        <p className="mb-4 flex items-center gap-2 text-sm text-champagne-deep">
          <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
          {flashMsg}
        </p>
      ) : null}

      {state === "sent" ? (
        <p className="text-sm text-ink-2">
          Vérifiez vos emails : un lien de confirmation vient d&apos;être envoyé
          à <span className="text-foreground">{email}</span>. L&apos;alerte
          s&apos;active dès que vous cliquez.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-ink-2">
            Recevez un email sans créer de compte. Confirmation requise,
            désinscription en un clic.
          </p>

          <fieldset className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={notifyOpen}
                onChange={(e) => setNotifyOpen(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--champagne-deep)]"
              />
              <span className="text-sm text-foreground">
                À l&apos;ouverture des offres
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={notifyLock}
                onChange={(e) => setNotifyLock(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--champagne-deep)]"
              />
              <span className="text-sm text-foreground">
                1 h avant la clôture
              </span>
            </label>
          </fieldset>

          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full border border-input bg-background px-4 py-3 text-base outline-none transition-colors focus-visible:border-champagne-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />

          {state === "error" ? (
            <p className="text-sm text-destructive">{message}</p>
          ) : null}

          <button
            type="submit"
            disabled={state === "sending"}
            className={CTA_CLASS}
          >
            {state === "sending" ? "Envoi..." : "Me tenir informé"}
          </button>
        </form>
      )}
    </div>
  );
}
