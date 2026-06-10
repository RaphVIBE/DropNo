"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/admin/auth";
import { isValidCarrier, NEXT_DELIVERY, type DeliveryStatus } from "@/lib/admin/orders";
import type { TablesUpdate } from "@/lib/supabase/types";

async function requireAdmin() {
  const role = await getRole();
  if (role.kind !== "platform_admin") redirect("/");
  return createClient();
}
const f = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";

function backTo(txId: string) {
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${txId}`);
  redirect(`/admin/commandes/${txId}`);
}

export async function createDelivery(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const txId = f(fd, "transaction_id");
  const carrier = f(fd, "carrier");
  const tracking = f(fd, "tracking_number") || null;
  if (!txId || !isValidCarrier(carrier)) return;
  await supabase.from("deliveries").insert({
    transaction_id: txId, carrier, tracking_number: tracking, status: "preparing",
  });
  backTo(txId);
}

export async function advanceDelivery(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = f(fd, "id");
  const txId = f(fd, "transaction_id");
  const target = f(fd, "status") as DeliveryStatus;

  const { data: d } = await supabase.from("deliveries").select("status").eq("id", id).maybeSingle();
  if (!d) return;
  if (!(NEXT_DELIVERY[d.status as DeliveryStatus] ?? []).includes(target)) return;

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
  await supabase.from("deliveries").update({ carrier, tracking_number: tracking }).eq("id", id);
  backTo(txId);
}
