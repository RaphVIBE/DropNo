"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/admin/auth";
import { computePayout, payoutStatus, type TxLite, type SerialOfferLite } from "@/lib/admin/finance";

async function requireAdmin() {
  const role = await getRole();
  if (role.kind !== "platform_admin") redirect("/");
  return { supabase: createClient(), userId: role.userId };
}
const f = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";

export type PayoutActionState = { error?: string; ok?: boolean };

/**
 * Enregistre le virement maison d'un drop : recalcule le dû côté serveur
 * (jamais depuis le formulaire) et snapshot les montants. Refusé si la
 * fenêtre de rétractation court encore ou si le règlement Stripe est
 * incomplet — ces états se règlent d'abord dans /admin/cloture.
 */
export async function marquerPaye(_prev: PayoutActionState, fd: FormData): Promise<PayoutActionState> {
  const { supabase, userId } = await requireAdmin();
  const dropId = f(fd, "drop_id");
  if (!dropId) return { error: "Drop introuvable." };

  const { data: existing } = await supabase
    .from("drop_payouts").select("id").eq("drop_id", dropId).maybeSingle();
  if (existing) return { error: "Ce drop a déjà un virement enregistré." };

  const [{ data: txs }, { data: offers }] = await Promise.all([
    supabase
      .from("transactions")
      .select("status, amount_paid_cents, platform_fee_cents, brand_payout_cents, withdrawal_window_ends_at")
      .eq("drop_id", dropId),
    // Privilège № 001 : supplément accepté inclus dans le dû maison.
    supabase
      .from("serial_offers")
      .select("status, supplement_cents")
      .eq("drop_id", dropId),
  ]);

  const c = computePayout(
    (txs ?? []) as TxLite[],
    Date.now(),
    (offers ?? []) as SerialOfferLite[]
  );
  const status = payoutStatus(c, false);
  if (status === "blocked") return { error: "Règlement Stripe incomplet — à régler d'abord dans Clôture." };
  if (status === "retractation") return { error: "Fenêtre de rétractation en cours — versement prématuré." };
  if (status !== "payable") return { error: "Rien à verser sur ce drop." };

  const { error } = await supabase.from("drop_payouts").insert({
    drop_id: dropId,
    units: c.units,
    gross_cents: c.grossCents,
    fee_cents: c.feeCents,
    net_cents: c.netCents,
    payment_reference: f(fd, "payment_reference") || null,
    note: f(fd, "note") || null,
    paid_by: userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/finance");
  return { ok: true };
}

/** Correction d'une erreur de saisie : supprime l'enregistrement de virement. */
export async function annulerPaiement(fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = f(fd, "id");
  if (!id) return;
  await supabase.from("drop_payouts").delete().eq("id", id);
  revalidatePath("/admin/finance");
}
