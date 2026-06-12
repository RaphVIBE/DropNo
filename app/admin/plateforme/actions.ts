"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/admin/auth";

// Les écritures sur platform_admins passent par la RLS « owner only »
// (policy platform_admins_owner_manage, 0023) — pas de service role ici.
// Le trigger protect_last_owner empêche tout lockout côté DB.

async function requireAdmin() {
  const role = await getRole();
  if (role.kind !== "platform_admin") redirect("/");
  return { supabase: createClient(), userId: role.userId };
}
const f = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";

export type AdminActionState = { error?: string; ok?: boolean };

export async function ajouterAdmin(_prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();
  const email = f(fd, "email").toLowerCase();
  const role = f(fd, "role") === "owner" ? "owner" : "staff";
  if (!email) return { error: "Email requis." };

  const { data: profile } = await supabase
    .from("profiles").select("id").ilike("email", email).maybeSingle();
  if (!profile) {
    return { error: "Aucun compte avec cet email. La personne doit s'être connectée au moins une fois." };
  }

  const { error } = await supabase
    .from("platform_admins").insert({ user_id: profile.id, role });
  if (error) {
    if (error.code === "23505") return { error: "Cette personne est déjà admin." };
    if (error.code === "42501") return { error: "Réservé aux owners." };
    return { error: error.message };
  }

  revalidatePath("/admin/plateforme");
  return { ok: true };
}

export async function retirerAdmin(fd: FormData): Promise<void> {
  const { supabase, userId } = await requireAdmin();
  const target = f(fd, "user_id");
  if (!target || target === userId) return; // pas d'auto-retrait
  // RLS owner-only + trigger dernier-owner protègent côté DB.
  await supabase.from("platform_admins").delete().eq("user_id", target);
  revalidatePath("/admin/plateforme");
}
