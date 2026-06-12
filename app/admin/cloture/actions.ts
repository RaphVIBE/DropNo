"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getRole } from "@/lib/admin/auth";
import { runSummary, type RunReport } from "@/lib/admin/cloture";

export type RelanceState = { error?: string; ok?: boolean; summary?: string };

/**
 * Relance la clôture d'un drop : ré-invoque l'edge function close-drop
 * (idempotente — les bids déjà capturés/relâchés sont skip, les échecs
 * Stripe sont retentés). Stripe reste confiné à l'edge function : le
 * back-office ne parle jamais à Stripe directement.
 *
 * Service role uniquement côté serveur (cf. lib/supabase/service.ts).
 */
export async function relancerCloture(_prev: RelanceState, fd: FormData): Promise<RelanceState> {
  const role = await getRole();
  if (role.kind !== "platform_admin") redirect("/");

  const dropId = (fd.get("drop_id") as string | null)?.trim() ?? "";
  if (!dropId) return { error: "Drop introuvable." };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur." };

  let payload: (RunReport & { error?: string }) | null = null;
  try {
    const res = await fetch(`${url}/functions/v1/close-drop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ drop_id: dropId, triggered_by: "admin" }),
      cache: "no-store",
    });
    payload = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: `Relance échouée : ${payload?.error ?? `HTTP ${res.status}`}` };
    }
  } catch (err) {
    return { error: `Relance échouée : ${err instanceof Error ? err.message : String(err)}` };
  }

  revalidatePath("/admin/cloture");
  revalidatePath(`/admin/cloture/${dropId}`);
  revalidatePath("/admin");

  const remaining = payload?.errors?.length ?? 0;
  const summary = payload ? runSummary(payload) : "";
  if (remaining > 0) {
    return { summary, error: `${remaining} erreur(s) Stripe restante(s) — voir le rapport ci-dessous.` };
  }
  return { ok: true, summary: summary || "Clôture relancée." };
}

export type PrivilegeState = { error?: string; ok?: boolean };

/**
 * Expire manuellement une offre Privilège № 001 pending (ex : top bidder
 * banni, suspicion de fraude). admin_expire_serial_offer vérifie elle-même
 * is_platform_admin() — la session utilisateur suffit.
 */
export async function expirerPrivilege(_prev: PrivilegeState, fd: FormData): Promise<PrivilegeState> {
  const role = await getRole();
  if (role.kind !== "platform_admin") redirect("/");

  const offerId = (fd.get("offer_id") as string | null)?.trim() ?? "";
  const dropId = (fd.get("drop_id") as string | null)?.trim() ?? "";
  if (!offerId) return { error: "Offre introuvable." };

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_expire_serial_offer", {
    p_offer_id: offerId,
  });
  if (error) return { error: error.message };
  if (!(data as { ok: boolean }).ok) return { error: "Offre non pending (déjà résolue ?)." };

  if (dropId) revalidatePath(`/admin/cloture/${dropId}`);
  revalidatePath("/admin/cloture");
  return { ok: true };
}
