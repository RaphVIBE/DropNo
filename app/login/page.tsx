"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-7 py-20">
      <Link
        href="/"
        className="font-serif text-[22px] font-light italic tracking-tight"
      >
        Drop <sup className="align-super text-[0.8em]">No.</sup>
      </Link>

      {status === "sent" ? (
        <div className="space-y-3">
          <h1 className="font-display text-3xl">Vérifiez vos emails</h1>
          <p className="text-ink-2">
            Un lien de connexion a été envoyé à <strong>{email}</strong>.
            Cliquez dessus pour accéder à votre compte.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-3xl">Connexion</h1>
            <p className="text-ink-2">
              Entrez votre email. Nous vous envoyons un lien sécurisé, sans mot
              de passe.
            </p>
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Envoi..." : "Recevoir le lien"}
          </Button>
          {status === "error" ? (
            <p className="text-sm text-destructive">{message}</p>
          ) : null}
        </form>
      )}
    </section>
  );
}
