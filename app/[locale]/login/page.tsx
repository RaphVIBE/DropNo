"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/browser";
import { SESSION_ONLY_COOKIE } from "@/lib/supabase/cookie-persistence";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/wordmark";

/** Messages lisibles pour les erreurs d'auth renvoyees par Supabase/GoTrue. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  otp_expired:
    "Ce lien de connexion a expiré ou a déjà été utilisé. Demandez-en un nouveau ci-dessous.",
  access_denied:
    "Ce lien de connexion n'est plus valide. Demandez-en un nouveau ci-dessous.",
  auth: "La connexion a échoué. Réessayez avec un nouveau code.",
  missing_code: "Lien de connexion incomplet. Demandez-en un nouveau ci-dessous.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
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
      setMessage(
        "Code incorrect ou expiré. Vérifiez les six chiffres, ou demandez un nouveau code."
      );
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
            <h1 className="font-display text-3xl">Entrez votre code</h1>
            <p className="text-ink-2">
              Un code à six chiffres a été envoyé à <strong>{email}</strong>.
              Saisissez-le ci-dessous pour vous connecter.
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
            aria-label="Code à six chiffres"
            className="w-full border border-input bg-card px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === "verifying" || code.length < 6}
          >
            {status === "verifying" ? "Connexion..." : "Se connecter"}
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
              {status === "sending" ? "Envoi..." : "Renvoyer le code"}
            </button>
            <button
              type="button"
              onClick={backToEmail}
              className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Modifier l&apos;email
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-3xl">Connexion</h1>
            <p className="text-ink-2">
              Entrez votre email. Nous vous envoyons un code à six chiffres, sans
              mot de passe.
            </p>
          </div>
          {authError ? (
            <p className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {AUTH_ERROR_MESSAGES[authError] ??
                "La connexion a échoué. Demandez un nouveau code ci-dessous."}
            </p>
          ) : null}
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
          />
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
              className="h-4 w-4 rounded-sm border-input accent-[oklch(0.72_0.07_80)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            Rester connecté sur cet appareil
          </label>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Envoi..." : "Recevoir le code"}
          </Button>
          {status === "error" ? (
            <p className="text-sm text-destructive">{message}</p>
          ) : null}
        </form>
      )}
    </section>
  );
}
