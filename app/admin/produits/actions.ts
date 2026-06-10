"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/admin/auth";
import {
  validateDrop, isPlannable, canPublish, canCancel, canDelete,
  type DropInput, type DropStatus,
} from "@/lib/admin/drops";

async function requireAdmin() {
  const role = await getRole();
  if (role.kind !== "platform_admin") redirect("/");
  return createClient();
}
const str = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";
const isoOrNull = (v: string) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

function parseInput(fd: FormData): DropInput {
  const euros = parseFloat(str(fd, "floor_price").replace(",", "."));
  return {
    brand_id: str(fd, "brand_id"),
    title: str(fd, "title"),
    piece_reference: str(fd, "piece_reference") || null,
    description: str(fd, "description") || null,
    floor_price_cents: Number.isFinite(euros) ? Math.round(euros * 100) : NaN,
    exemplaires: parseInt(str(fd, "exemplaires"), 10),
    bid_window_opens_at: isoOrNull(str(fd, "bid_window_opens_at")) ?? "",
    bid_lock_at: isoOrNull(str(fd, "bid_lock_at")),
    reveal_at: isoOrNull(str(fd, "reveal_at")) ?? "",
    hero_image_url: str(fd, "hero_image_url") || null,
    images_urls: str(fd, "images_urls").split("\n").map((s) => s.trim()).filter(Boolean),
  };
}

export type ActionState = { error?: string; ok?: boolean };

export async function createDraft(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const input = parseInput(fd);
  const errors = validateDrop(input);
  if (errors.length) return { error: errors.join(" ") };

  // Numéro de drop suivant (volume curé → max+1 suffit ; une séquence durcirait les races).
  const { data: last } = await supabase
    .from("drops").select("drop_number").order("drop_number", { ascending: false }).limit(1).maybeSingle();
  const nextNumber = (last?.drop_number ?? -1) + 1;

  const { data, error } = await supabase
    .from("drops").insert({ ...input, drop_number: nextNumber, status: "draft" }).select("id").single();
  if (error) return { error: error.message };

  revalidatePath("/admin/produits");
  redirect(`/admin/produits/${data.id}`);
}

export async function saveDrop(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = str(fd, "id");
  if (!id) return { error: "Drop introuvable." };

  const { data: current } = await supabase.from("drops").select("status").eq("id", id).maybeSingle();
  if (!current) return { error: "Drop introuvable." };
  const status = current.status as DropStatus;
  const input = parseInput(fd);

  if (isPlannable(status)) {
    const errors = validateDrop(input);
    if (errors.length) return { error: errors.join(" ") };
    const { error } = await supabase.from("drops").update(input).eq("id", id);
    if (error) return { error: error.message };
  } else if (status === "open" || status === "closed") {
    // Enchère en cours : seul le contenu mou change, jamais fenêtres/plancher/exemplaires.
    const { error } = await supabase
      .from("drops")
      .update({ description: input.description, hero_image_url: input.hero_image_url, images_urls: input.images_urls })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    return { error: "Ce drop est figé (révélé ou annulé)." };
  }

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${id}`);
  return { ok: true };
}

export async function publishDrop(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = str(fd, "id");
  const { data: d } = await supabase.from("drops").select("*").eq("id", id).maybeSingle();
  if (!d || !canPublish(d.status as DropStatus)) return;
  if (validateDrop(d as unknown as DropInput, { requireFutureReveal: true }).length) return;
  await supabase.from("drops").update({ status: "scheduled" }).eq("id", id);
  revalidatePath("/admin/produits");
  redirect(`/admin/produits/${id}`);
}

export async function cancelDrop(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = str(fd, "id");
  const { data: d } = await supabase.from("drops").select("status").eq("id", id).maybeSingle();
  if (!d || !canCancel(d.status as DropStatus)) return; // un drop ouvert se résout via le flux Stripe
  await supabase.from("drops").update({ status: "cancelled" }).eq("id", id);
  revalidatePath("/admin/produits");
  redirect(`/admin/produits/${id}`);
}

export async function deleteDrop(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = str(fd, "id");
  const { data: d } = await supabase.from("drops").select("status").eq("id", id).maybeSingle();
  if (!d || !canDelete(d.status as DropStatus)) return; // seuls les brouillons sont supprimables
  await supabase.from("drops").delete().eq("id", id);
  revalidatePath("/admin/produits");
  redirect("/admin/produits");
}

// Décale un drop dans le calendrier : ouverture, verrouillage et reveal sont
// translatés du même nombre de jours (l'espacement relatif est préservé).
// Réservé aux drops draft/scheduled (pas d'enchère en cours).
export async function shiftDrop(fd: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = str(fd, "id");
  const days = parseInt(str(fd, "days"), 10);
  if (!id || !Number.isFinite(days) || days === 0) return;

  const { data: d } = await supabase
    .from("drops")
    .select("status, bid_window_opens_at, bid_lock_at, reveal_at")
    .eq("id", id)
    .maybeSingle();
  if (!d || !isPlannable(d.status as DropStatus)) return;

  const shift = (iso: string | null) =>
    iso ? new Date(new Date(iso).getTime() + days * 86400000).toISOString() : null;

  await supabase
    .from("drops")
    .update({
      bid_window_opens_at: shift(d.bid_window_opens_at) ?? d.bid_window_opens_at,
      bid_lock_at: shift(d.bid_lock_at),
      reveal_at: shift(d.reveal_at) ?? d.reveal_at,
    })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/produits");
  redirect("/admin");
}
