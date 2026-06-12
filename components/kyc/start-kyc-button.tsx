"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Bouton qui demarre une verification Stripe Identity puis redirige vers la
 * page hebergee Stripe. Reutilisable (page Drop, dashboard). Le retour se fait
 * sur returnUrl cote serveur ; le webhook bascule kyc_status -> verified.
 */
export function StartKycButton({
  dropId,
  className,
  children,
}: {
  dropId?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations("bidForm");
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
        setMessage(data.error ?? t("kycStartError"));
        return;
      }
      window.location.href = data.url;
    } catch {
      setStatus("error");
      setMessage(t("errorServer"));
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
          "bg-primary px-6 py-3 text-[13px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {status === "starting"
          ? t("kycStarting")
          : (children ?? t("kycVerifyCta"))}
      </button>
      {status === "error" ? (
        <p className="mt-3 text-sm text-destructive">{message}</p>
      ) : null}
    </>
  );
}
