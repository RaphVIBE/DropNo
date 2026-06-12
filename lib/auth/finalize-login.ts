import { createClient } from "@/lib/supabase/server";

/**
 * Garde anti-open-redirect : on n'accepte qu'un chemin interne absolu
 * (`/account/...`), jamais une URL externe (`//evil.com`, `https://…`) ni un
 * chemin protocole-relatif. Sinon on renvoie null (destination par défaut).
 */
export function safeInternalPath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

/**
 * Finalise une connexion dont la session est déjà posée dans les cookies
 * (magic link via `/auth/callback`, ou code OTP vérifié côté client puis
 * `/auth/post-login`). Upsert idempotent du profil, puis résolution de la
 * destination : une cible explicite `?redirect=` prime ; sinon les opérateurs
 * vont au back-office, les clients à leur compte.
 *
 * Retourne `null` si aucune session valide n'est présente.
 */
export async function resolveLoginDest(
  redirectParam: string | null
): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // RLS : l'utilisateur ne touche que sa propre row.
  await supabase
    .from("profiles")
    .upsert(
      { id: user.id, email: user.email ?? "" },
      { onConflict: "id", ignoreDuplicates: true }
    );

  const dest = safeInternalPath(redirectParam);
  if (dest) return dest;

  const { data: admin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return admin ? "/admin" : "/account/dashboard";
}
