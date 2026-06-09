import { createClient } from "@/lib/supabase/server";

/**
 * Rôle de l'utilisateur courant pour le back-office.
 *  - platform_admin : opérateur (accès complet /admin)
 *  - maison_manager : responsable de maison (scopé à une ou plusieurs marques)
 *  - none           : utilisateur sans rôle back-office
 */
export type Role =
  | { kind: "platform_admin"; userId: string }
  | { kind: "maison_manager"; userId: string; brandIds: string[] }
  | { kind: "none"; userId: string | null };

export async function getRole(): Promise<Role> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "none", userId: null };

  const { data: pa } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (pa) return { kind: "platform_admin", userId: user.id };

  const { data: ba } = await supabase
    .from("brand_admins")
    .select("brand_id")
    .eq("user_id", user.id);
  if (ba && ba.length > 0) {
    return { kind: "maison_manager", userId: user.id, brandIds: ba.map((r) => r.brand_id) };
  }

  return { kind: "none", userId: user.id };
}
