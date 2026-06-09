"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/admin/auth";
import { validateMaison, slugify, type MaisonInput, type BrandStatus } from "@/lib/admin/maisons";

async function requireAdmin() {
  const role = await getRole();
  if (role.kind !== "platform_admin") redirect("/");
  return createClient();
}
const f = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";

function parse(fd: FormData): MaisonInput {
  const name = f(fd, "name");
  return {
    name,
    slug: f(fd, "slug") || slugify(name),
    description: f(fd, "description") || null,
    logo_url: f(fd, "logo_url") || null,
    website_url: f(fd, "website_url") || null,
    country_code: f(fd, "country_code").toUpperCase() || null,
    status: (f(fd, "status") || "pending") as BrandStatus,
    kbis_verified: fd.get("kbis_verified") === "on",
    stripe_account_id: f(fd, "stripe_account_id") || null,
  };
}

export type ActionState = { error?: string; ok?: boolean };

function friendly(msg: string): string {
  if (msg.includes("brands_slug_key") || (msg.includes("duplicate") && msg.includes("slug")))
    return "Ce slug est déjà pris par une autre maison.";
  if (msg.includes("brands_")) return "Une règle de validation n'est pas respectée (vérifie les formats).";
  return msg;
}

export async function createMaison(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const input = parse(fd);
  const errors = validateMaison(input);
  if (errors.length) return { error: errors.join(" ") };
  const { data, error } = await supabase.from("brands").insert(input).select("id").single();
  if (error) return { error: friendly(error.message) };
  revalidatePath("/admin/maisons");
  redirect(`/admin/maisons/${data.id}`);
}

export async function saveMaison(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = f(fd, "id");
  if (!id) return { error: "Maison introuvable." };
  const input = parse(fd);
  const errors = validateMaison(input);
  if (errors.length) return { error: errors.join(" ") };
  const { error } = await supabase.from("brands").update(input).eq("id", id);
  if (error) return { error: friendly(error.message) };
  revalidatePath("/admin/maisons");
  revalidatePath(`/admin/maisons/${id}`);
  return { ok: true };
}

// Invite un responsable par email : résout (ou crée) l'utilisateur + profil,
// puis le lie dans brand_admins. Service role (serveur uniquement).
export async function inviteManager(fd: FormData): Promise<void> {
  await requireAdmin();
  const admin = createServiceClient();
  const brandId = f(fd, "brand_id");
  const email = f(fd, "email").toLowerCase();
  const role = f(fd, "role") === "viewer" ? "viewer" : "admin";
  if (!brandId || !email) return;

  const { data: prof } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  let userId: string | undefined = prof?.id;

  if (!userId) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const { data: inv } = await admin.auth.admin.inviteUserByEmail(
      email,
      appUrl ? { redirectTo: `${appUrl}/` } : undefined
    );
    userId = inv?.user?.id;
    if (!userId) {
      const { data: list } = await admin.auth.admin.listUsers();
      userId = list?.users?.find((u) => u.email?.toLowerCase() === email)?.id;
    }
    if (userId) await admin.from("profiles").upsert({ id: userId, email }, { onConflict: "id" });
  }

  if (!userId) return;
  await admin.from("brand_admins").upsert({ brand_id: brandId, user_id: userId, role }, { onConflict: "brand_id,user_id" });
  revalidatePath(`/admin/maisons/${brandId}`);
  redirect(`/admin/maisons/${brandId}`);
}

export async function revokeManager(fd: FormData): Promise<void> {
  await requireAdmin();
  const admin = createServiceClient();
  const brandId = f(fd, "brand_id");
  const userId = f(fd, "user_id");
  if (!brandId || !userId) return;
  await admin.from("brand_admins").delete().eq("brand_id", brandId).eq("user_id", userId);
  revalidatePath(`/admin/maisons/${brandId}`);
  redirect(`/admin/maisons/${brandId}`);
}
