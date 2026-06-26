import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { sendAlertConfirm, emailLocale } from "@/lib/email/send";
import { alertsClient, isValidEmail, newAlertToken, siteUrl } from "@/lib/alerts";
import { clientIp, isHoneypotFilled, rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Inscription à une alerte montre (sans compte). Double opt-in : on enregistre
 * une alerte `pending` et on envoie un email de confirmation. L'alerte n'est
 * armée qu'au clic sur le lien (/api/alerts/confirm).
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  // Honeypot : bot détecté -> faux succès, aucun email envoyé.
  if (isHoneypotFilled(b)) {
    return NextResponse.json({ ok: true });
  }
  // Rate-limit best-effort : empêche le bombardement d'emails de confirmation.
  if (rateLimited("alerts", clientIp(request), 5)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const dropId = typeof b.dropId === "string" ? b.dropId : "";
  const email =
    typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const notifyOpen = b.notifyOpen === true;
  const notifyLock = b.notifyLock === true;

  if (!dropId || !isValidEmail(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (!notifyOpen && !notifyLock) {
    return NextResponse.json(
      { error: "Choisissez au moins un rappel." },
      { status: 400 }
    );
  }

  // Le drop doit exister et accepter encore des alertes (à venir / en cours).
  const svc = createServiceClient();
  const { data: drop } = await svc
    .from("drops")
    .select("id, drop_number, title, status")
    .eq("id", dropId)
    .maybeSingle();
  if (!drop) {
    return NextResponse.json({ error: "Drop introuvable." }, { status: 404 });
  }
  if (!["scheduled", "open"].includes(drop.status ?? "")) {
    return NextResponse.json(
      { error: "Ce drop n'accepte plus d'alerte." },
      { status: 409 }
    );
  }

  const token = newAlertToken();
  // Drop déjà ouvert -> on neutralise le rappel "ouverture" (il est déjà ouvert).
  const openSentAt = drop.status === "open" ? new Date().toISOString() : null;

  const locale = emailLocale(cookies().get("NEXT_LOCALE")?.value);
  const alerts = alertsClient();
  const { error: upErr } = await alerts.from("drop_alerts").upsert(
    {
      drop_id: dropId,
      email,
      notify_open: notifyOpen,
      notify_lock: notifyLock,
      status: "pending",
      confirm_token: token,
      confirmed_at: null,
      open_sent_at: openSentAt,
      lock_sent_at: null,
      locale,
    },
    { onConflict: "drop_id,email" }
  );
  if (upErr) {
    return NextResponse.json(
      { error: "Enregistrement impossible." },
      { status: 500 }
    );
  }

  const confirmUrl = `${siteUrl()}/api/alerts/confirm?token=${token}`;
  await sendAlertConfirm(
    email,
    {
      dropNumber: drop.drop_number ?? 0,
      title: drop.title ?? "",
      confirmUrl,
    },
    locale
  );

  return NextResponse.json({ ok: true });
}
