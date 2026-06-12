"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/admin/auth";
import {
  isValidCarrier, nextDeliverySteps, parseDirection, type DeliveryStatus,
} from "@/lib/admin/orders";
import { canRefund, canReject, NEXT_WITHDRAWAL, type WithdrawalStatus } from "@/lib/admin/retractation";
import type { TablesUpdate } from "@/lib/supabase/types";

async function requireAdmin() {
  const role = await getRole();
  if (role.kind !== "platform_admin") redirect("/");
  return createClient();
}

async function requireAdminWithId() {
  const role = await getRole();
  if (role.kind !== "platform_admin") redirect("/");
  return { supabase: createClient(), userId: role.userId };
}
const f = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";

function backTo(txId: string) {
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${txId}`);
  redirect(`/admin/commandes/${txId}`);
}

/** "1234,56" (euros) → cents, ou null. */
function eurosToCents(v: string): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export async function createDelivery(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const txId = f(fd, "transaction_id");
  const carrier = f(fd, "carrier");
  const direction = parseDirection(f(fd, "direction"));
  const tracking = f(fd, "tracking_number") || null;
  if (!txId || !isValidCarrier(carrier)) return;
  await supabase.from("deliveries").insert({
    transaction_id: txId,
    carrier,
    direction,
    tracking_number: tracking,
    insured_value_cents: eurosToCents(f(fd, "insured_value")),
    status: direction === "return" ? "pending" : "preparing",
  });
  backTo(txId);
}

export async function advanceDelivery(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = f(fd, "id");
  const txId = f(fd, "transaction_id");
  const target = f(fd, "status") as DeliveryStatus;

  const { data: d } = await supabase.from("deliveries").select("status, direction").eq("id", id).maybeSingle();
  if (!d) return;
  if (!nextDeliverySteps(parseDirection(d.direction), d.status as DeliveryStatus).includes(target)) return;

  const patch: TablesUpdate<"deliveries"> = { status: target };
  if (target === "shipped") patch.shipped_at = new Date().toISOString();
  if (target === "delivered") patch.delivered_at = new Date().toISOString();
  await supabase.from("deliveries").update(patch).eq("id", id);
  backTo(txId);
}

export async function updateTracking(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = f(fd, "id");
  const txId = f(fd, "transaction_id");
  const carrier = f(fd, "carrier");
  const tracking = f(fd, "tracking_number") || null;
  if (!isValidCarrier(carrier)) return;
  await supabase
    .from("deliveries")
    .update({ carrier, tracking_number: tracking, insured_value_cents: eurosToCents(f(fd, "insured_value")) })
    .eq("id", id);
  backTo(txId);
}

// ---------------------------------------------------------------------------
// Rétractation 14j (0024) — workflow opéré ici, refund via edge function.
// ---------------------------------------------------------------------------

export async function creerRetractation(fd: FormData): Promise<void> {
  const { supabase, userId } = await requireAdminWithId();
  const txId = f(fd, "transaction_id");
  if (!txId) return;
  const { data: tx } = await supabase.from("transactions").select("status").eq("id", txId).maybeSingle();
  if (!tx || tx.status !== "captured") return; // seules les commandes capturées se rétractent
  await supabase.from("withdrawal_requests").insert({
    transaction_id: txId,
    reason: f(fd, "reason") || null,
    created_by: userId,
  });
  backTo(txId);
}

export async function avancerRetractation(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = f(fd, "id");
  const txId = f(fd, "transaction_id");
  const target = f(fd, "status") as WithdrawalStatus;

  const { data: wr } = await supabase.from("withdrawal_requests").select("status").eq("id", id).maybeSingle();
  if (!wr || !(NEXT_WITHDRAWAL[wr.status as WithdrawalStatus] ?? []).includes(target)) return;

  await supabase.from("withdrawal_requests").update({ status: target }).eq("id", id);

  // Pièce reçue → l'aller passe en « retournée », le trajet retour en « reçue ».
  if (target === "received") {
    await supabase.from("deliveries").update({ status: "returned" })
      .eq("transaction_id", txId).eq("direction", "outbound").eq("status", "delivered");
    await supabase.from("deliveries").update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("transaction_id", txId).eq("direction", "return").neq("status", "delivered");
  }
  backTo(txId);
}

export async function refuserRetractation(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = f(fd, "id");
  const txId = f(fd, "transaction_id");
  const motif = f(fd, "rejection_reason");
  if (!motif) return; // motif obligatoire

  const { data: wr } = await supabase.from("withdrawal_requests").select("status").eq("id", id).maybeSingle();
  if (!wr || !canReject(wr.status as WithdrawalStatus)) return;

  await supabase
    .from("withdrawal_requests")
    .update({ status: "rejected", rejection_reason: motif })
    .eq("id", id);
  backTo(txId);
}

export type RefundState = { error?: string; ok?: boolean; refundId?: string };

/**
 * Déclenche le remboursement intégral via l'edge function refund-transaction
 * (idempotente : clé Stripe `refund-<tx>`, pas de double refund possible).
 * Conditions re-vérifiées côté serveur : rétractation au statut « reçue ».
 */
export async function rembourser(_prev: RefundState, fd: FormData): Promise<RefundState> {
  const supabase = await requireAdmin();
  const txId = f(fd, "transaction_id");
  if (!txId) return { error: "Commande introuvable." };

  const { data: wr } = await supabase
    .from("withdrawal_requests").select("status").eq("transaction_id", txId).maybeSingle();
  if (!wr || !canRefund(wr.status as WithdrawalStatus)) {
    return { error: "Le remboursement exige une rétractation au statut « Pièce reçue »." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur." };

  try {
    const res = await fetch(`${url}/functions/v1/refund-transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ transaction_id: txId }),
      cache: "no-store",
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.ok) {
      return { error: `Refund échoué : ${payload?.error ?? `HTTP ${res.status}`}` };
    }
    revalidatePath("/admin/commandes");
    revalidatePath(`/admin/commandes/${txId}`);
    revalidatePath("/admin/finance");
    return { ok: true, refundId: payload.stripe_refund_id };
  } catch (err) {
    return { error: `Refund échoué : ${err instanceof Error ? err.message : String(err)}` };
  }
}
