"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/admin/auth";
import { STATUSES, PRIORITIES, CATEGORIES, type TicketStatus, type Priority, type Category } from "@/lib/admin/support";

async function admin() {
  const role = await getRole();
  if (role.kind !== "platform_admin") redirect("/");
  return { supabase: createClient(), userId: role.userId };
}
const f = (fd: FormData, k: string) => (fd.get(k) as string | null)?.trim() ?? "";

export type ActionState = { error?: string };

export async function createTicket(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, userId } = await admin();
  const email = f(fd, "client_email").toLowerCase();
  const subject = f(fd, "subject");
  const category = (CATEGORIES.includes(f(fd, "category") as Category) ? f(fd, "category") : "other") as Category;
  const priority = (PRIORITIES.includes(f(fd, "priority") as Priority) ? f(fd, "priority") : "normal") as Priority;
  const body = f(fd, "body");
  if (subject.length < 3 || subject.length > 120) return { error: "Le sujet doit faire 3 à 120 caractères." };
  if (!body) return { error: "Le premier message ne peut pas être vide." };

  const svc = createServiceClient();
  const { data: prof } = await svc.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!prof) return { error: "Aucun compte client avec cet email." };

  const { data: ticket, error } = await supabase
    .from("support_tickets").insert({ user_id: prof.id, subject, category, priority }).select("id").single();
  if (error) return { error: error.message };

  await supabase.from("support_messages").insert({ ticket_id: ticket.id, author_id: userId, author_kind: "staff", body, is_internal: false });
  revalidatePath("/admin/support");
  redirect(`/admin/support/${ticket.id}`);
}

export async function postReply(fd: FormData): Promise<void> {
  const { supabase, userId } = await admin();
  const ticketId = f(fd, "ticket_id");
  const body = f(fd, "body");
  const isInternal = fd.get("is_internal") === "on";
  if (!ticketId || !body) return;
  await supabase.from("support_messages").insert({ ticket_id: ticketId, author_id: userId, author_kind: "staff", body, is_internal: isInternal });
  if (!isInternal) await supabase.from("support_tickets").update({ status: "pending" }).eq("id", ticketId);
  revalidatePath(`/admin/support/${ticketId}`);
  redirect(`/admin/support/${ticketId}`);
}

export async function setStatus(fd: FormData): Promise<void> {
  const { supabase } = await admin();
  const ticketId = f(fd, "ticket_id");
  const status = f(fd, "status") as TicketStatus;
  if (!STATUSES.includes(status)) return;
  await supabase.from("support_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", ticketId);
  revalidatePath(`/admin/support/${ticketId}`);
  redirect(`/admin/support/${ticketId}`);
}

export async function setPriority(fd: FormData): Promise<void> {
  const { supabase } = await admin();
  const ticketId = f(fd, "ticket_id");
  const priority = f(fd, "priority") as Priority;
  if (!PRIORITIES.includes(priority)) return;
  await supabase.from("support_tickets").update({ priority }).eq("id", ticketId);
  revalidatePath(`/admin/support/${ticketId}`);
  redirect(`/admin/support/${ticketId}`);
}

export async function assignToMe(fd: FormData): Promise<void> {
  const { supabase, userId } = await admin();
  const ticketId = f(fd, "ticket_id");
  await supabase.from("support_tickets").update({ assigned_to: userId }).eq("id", ticketId);
  revalidatePath(`/admin/support/${ticketId}`);
  redirect(`/admin/support/${ticketId}`);
}
