"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/browser";
import { SESSION_ONLY_COOKIE } from "@/lib/supabase/cookie-persistence";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/wordmark";

/** Clés des erreurs d'auth renvoyées par Supabase/GoTrue. */
const AUTH_ERROR_KEYS = new Set([
  "otp_expired",
  "access_denied",
  "auth",
  "missing_code",
]);

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const t = useTranslations("login");
  const searchParams = useSearchParams();
  const authError = searchParams.get("auth_error") ?? searchParams.get("error");
  const redirect = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<
    "idle" | "sending" | "verifying" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  /**
   * Envoie un code à six chiffres (et, en repli, un lien magique : le même email
   * contient les deux). `emailRedirectTo` alimente le lien ; le code, lui, se
   * vérifie dans cet onglet — pas de saut vers la boîte mail.
   */
  async function sendCode(targetEmail: string) {
    const supabase = createClient();
    const callbackUrl = `${window.location.origin}/auth/callback${
      redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""
    }`;
    return supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { emailRedirectTo: callbackUrl },
    });
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    const { error } = await sendCode(email);
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("idle");
      setCode("");
      setStep("code");
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setMessage("");

    // Pose l'indicateur de persistance AVANT verifyOtp, pour que la session
    // posée juste après (et rafraîchie par le middleware) adopte la bonne durée.
    if (keepLoggedIn) {
      document.cookie = `${SESSION_ONLY_COOKIE}=; path=/; max-age=0; samesite=lax`;
    } else {
      document.cookie = `${SESSION_ONLY_COOKIE}=1; path=/; samesite=lax`;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    if (error) {
      setStatus("error");
      setMessage(t("codeError"));
      return;
    }

    // La session est posée dans les cookies par le client navigateur ;
    // on finalise côté serveur (upsert profil + routage admin/compte).
    window.location.assign(
      `/auth/post-login${
        redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""
      }`
    );
  }

  async function handleResend() {
    setStatus("sending");
    setMessage("");
    const { error } = await sendCode(email);
    setStatus(error ? "error" : "idle");
    if (error) setMessage(error.message);
  }

  function backToEmail() {
    setStep("email");
    setStatus("idle");
    setMessage("");
    setCode("");
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-7 py-20">
      <Link
        href="/"
        className="rounded-sm text-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Wordmark />
      </Link>

      {step === "code" ? (
        <form onSubmit={handleCodeSubmit} className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-3xl">{t("codeTitle")}</h1>
            <p className="text-ink-2">
              {t.rich("codeIntro", {
                email,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            aria-label={t("codeAriaLabel")}
            className="w-full border border-input bg-card px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === "verifying" || code.length < 6}
          >
            {status === "verifying" ? t("connecting") : t("submitCode")}
          </Button>
          {status === "error" ? (
            <p className="text-sm text-destructive">{message}</p>
          ) : null}
          <div className="flex items-center justify-between text-sm text-ink-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={status === "sending"}
              className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {status === "sending" ? t("sending") : t("resendCode")}
            </button>
            <button
              type="button"
              onClick={backToEmail}
              className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("changeEmail")}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-3xl">{t("emailTitle")}</h1>
            <p className="text-ink-2">{t("emailIntro")}</p>
          </div>
          {authError ? (
            <p className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {AUTH_ERROR_KEYS.has(authError)
                ? t(`authError.${authError}`)
                : t("authError.fallback")}
            </p>
          ) : null}
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            className="w-full border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
          />
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
              className="h-4 w-4 rounded-sm border-input accent-[oklch(0.72_0.07_80)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {t("keepLoggedIn")}
          </label>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === "sending"}
          >
            {status === "sending" ? t("sending") : t("requestCode")}
          </Button>
          {status === "error" ? (
            <p className="text-sm text-destructive">{message}</p>
          ) : null}
        </form>
      )}
    </section>
  );
}
