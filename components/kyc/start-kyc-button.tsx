"use client";

import { useState } from "react";

/**
 * Bouton qui demarre une verification Stripe Identity puis redirige vers la
 * page hebergee Stripe. Reutilisable (page Drop, dashboard). Le retour se fait
 * sur returnUrl cote serveur ; le webhook bascule kyc_status -> verified.
 */
export function StartKycButton({
  dropId,
  className,
  children = "Vérifier mon identité",
}: {
  dropId?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [status, setStatus] = useState<"idle" | "starting" | "error">("idle");
  const [message, setMessage] = useState("");

  async function start() {
    setStatus("starting");
    setMessage("");
    try {
      const res = await fetch("/api/stripe/identity-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dropId ? { dropId } : {}),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setStatus("error");
        setMessage(data.error ?? "Impossible de démarrer la vérification.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setStatus("error");
      setMessage("Impossible de joindre le serveur.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={status === "starting"}
        className={
          className ??
          "bg-primary px-6 py-3 text-[13px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {status === "starting" ? "Ouverture..." : children}
      </button>
      {status === "error" ? (
        <p className="mt-3 text-sm text-destructive">{message}</p>
      ) : null}
    </>
  );
}
