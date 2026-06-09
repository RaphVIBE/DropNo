"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

/**
 * Connexion par mot de passe — uniquement pour le DEV local (accès back-office
 * sans dépendre du magic-link / SMTP). Désactivée en production.
 */
export default function DevLoginPage() {
  const [email, setEmail] = useState("raph@veracruz.be");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (process.env.NODE_ENV === "production") {
    return <main className="p-10 text-sm">Indisponible.</main>;
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    // Navigation pleine pour que le middleware/serveur voient la session.
    window.location.href = "/admin";
  }

  const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-7">
      <div>
        <h1 className="font-display text-3xl">Connexion dev</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accès back-office par mot de passe (local uniquement).</p>
      </div>
      <form onSubmit={signIn} className="space-y-3">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} placeholder="mot de passe" autoFocus />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Connexion…" : "Se connecter → /admin"}</Button>
      </form>
    </main>
  );
}
