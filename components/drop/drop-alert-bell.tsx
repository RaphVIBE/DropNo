"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, Check } from "lucide-react";

/**
 * Cloche d'alerte à côté du compteur. Clic -> popover avec les options
 * (email + rappels). Double opt-in côté serveur. L'état « actif » est mémorisé
 * par navigateur (localStorage), faute de compte : on le pose à la
 * confirmation (retour ?alert=confirmed) et on le retire à la désinscription.
 */

type Persisted = "none" | "pending" | "active";

export function DropAlertBell({
  dropId,
  status,
  flash,
}: {
  dropId: string;
  status: string;
  flash?: string;
}) {
  const storageKey = `dropno_alert_${dropId}`;
  const ref = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [persisted, setPersisted] = useState<Persisted>("none");
  const [email, setEmail] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(status === "scheduled");
  const [notifyLock, setNotifyLock] = useState(true);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  // Lecture de l'état mémorisé + réaction au retour de confirmation/désinscription.
  useEffect(() => {
    let cur: Persisted = "none";
    try {
      cur = (localStorage.getItem(storageKey) as Persisted) || "none";
    } catch {
      /* localStorage indisponible */
    }
    if (flash === "confirmed") {
      cur = "active";
      try {
        localStorage.setItem(storageKey, "active");
      } catch {
        /* noop */
      }
    } else if (flash === "off") {
      cur = "none";
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* noop */
      }
    }
    setPersisted(cur);
    if (flash === "confirmed" || flash === "off") setOpen(true);
  }, [flash, storageKey]);

  // Fermeture au clic extérieur / Échap.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
      setPersisted("pending");
      try {
        localStorage.setItem(storageKey, "pending");
      } catch {
        /* noop */
      }
    } catch {
      setState("error");
      setMessage("Impossible de joindre le serveur.");
    }
  }

  const active = persisted === "active";
  const pending = persisted === "pending";
  const BellIcon = active ? BellRing : Bell;
  const flashMsg =
    flash === "confirmed"
      ? "Alerte confirmée. Vous serez prévenu par email."
      : flash === "off"
        ? "Vous ne recevrez plus d'alerte pour ce drop."
        : flash === "invalid"
          ? "Ce lien d'alerte n'est plus valide."
          : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          active ? "Alerte active pour ce drop" : "Être prévenu de ce drop"
        }
        className={`relative -my-1 inline-flex size-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          active
            ? "text-champagne-deep"
            : "text-ink-2 hover:text-foreground"
        }`}
      >
        <BellIcon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
        {active || pending ? (
          <span
            className="absolute right-1.5 top-1 size-1.5 rounded-full bg-champagne-deep"
            aria-hidden="true"
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Être prévenu de ce drop"
          className="absolute right-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-3.5rem))] border border-rule bg-card p-5 text-left shadow-soft"
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`text-[11px] font-medium uppercase tracking-[0.18em] ${
                active ? "text-champagne-deep" : "text-muted-foreground"
              }`}
            >
              {active
                ? "Alerte active"
                : pending
                  ? "Confirmation en attente"
                  : "Me tenir informé"}
            </span>
          </div>

          {flashMsg ? (
            <p className="mb-3 flex items-start gap-2 text-sm text-champagne-deep">
              <Check className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              {flashMsg}
            </p>
          ) : null}

          {state === "sent" ? (
            <p className="text-sm text-ink-2">
              Vérifiez vos emails : un lien de confirmation vient d&apos;être
              envoyé à <span className="text-foreground">{email}</span>.
            </p>
          ) : active ? (
            <p className="text-sm text-ink-2">
              Vous serez prévenu par email aux moments choisis. Pour vous
              désinscrire, utilisez le lien présent dans nos emails.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-ink-2">
                Un email, sans créer de compte. Confirmation requise.
              </p>
              <fieldset className="space-y-2">
                <label className="flex cursor-pointer items-start gap-2.5">
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
                <label className="flex cursor-pointer items-start gap-2.5">
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
                className="w-full border border-input bg-background px-3 py-2.5 text-[15px] outline-none transition-colors focus-visible:border-champagne-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
              {state === "error" ? (
                <p className="text-sm text-destructive">{message}</p>
              ) : null}
              <button
                type="submit"
                disabled={state === "sending"}
                className="block w-full bg-primary px-5 py-3 text-center text-[12px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === "sending" ? "Envoi..." : "Me prévenir"}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
