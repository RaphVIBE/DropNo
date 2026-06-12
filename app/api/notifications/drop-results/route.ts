import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { sendDropResult, emailLocale } from "@/lib/email/send";
import { isEmailConfigured } from "@/lib/email/client";

export const dynamic = "force-dynamic";

/**
 * Envoie les emails de résultat (gagné / non retenu) d'un drop révélé (US-22).
 *
 * Endpoint interne, appelé par l'edge function close-drop après clôture.
 * Protégé par un secret partagé (header x-notify-secret == NOTIFY_SECRET) ;
 * fail-closed si le secret n'est pas configuré.
 *
 * Idempotent : drops.result_notified_at est posé une fois les emails envoyés,
 * pour qu'un re-run de close-drop ne renvoie pas les emails.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.NOTIFY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "NOTIFY_SECRET non configuré." },
      { status: 503 }
    );
  }
  if (request.headers.get("x-notify-secret") !== secret) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let dropId: string | undefined;
  try {
    dropId = (await request.json())?.dropId;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!dropId) {
    return NextResponse.json({ error: "dropId manquant." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: drop } = await supabase
    .from("drops")
    .select("drop_number, title, clearing_price_cents, status, result_notified_at")
    .eq("id", dropId)
    .maybeSingle();

  if (!drop) {
    return NextResponse.json({ error: "Drop introuvable." }, { status: 404 });
  }
  if (drop.status !== "revealed") {
    return NextResponse.json(
      { error: "Drop non révélé.", status: drop.status },
      { status: 409 }
    );
  }
  if (drop.result_notified_at) {
    return NextResponse.json({ ok: true, skipped: "already_notified" });
  }

  const { data: rows } = await supabase.rpc("drop_result_recipients", {
    p_drop_id: dropId,
  });
  const recipients = (rows ?? []) as unknown as Array<{
    user_id: string;
    email: string | null;
    status: string;
  }>;

  // Langue de chaque destinataire (emails hors contexte de requête).
  const userIds = recipients.map((r) => r.user_id);
  const { data: profs } = userIds.length
    ? await supabase.from("profiles").select("id, locale").in("id", userIds)
    : { data: [] as { id: string; locale: string }[] };
  const localeById = new Map(
    (profs ?? []).map((p) => [p.id, p.locale] as const)
  );

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    if (!r.email) continue;
    const res = await sendDropResult(
      r.email,
      {
        won: r.status === "won",
        dropNumber: drop.drop_number ?? 0,
        title: drop.title ?? "votre pièce",
        clearingPriceCents: drop.clearing_price_cents,
        dropId,
      },
      emailLocale(localeById.get(r.user_id))
    );
    if (res.ok) sent++;
    else failed++;
  }

  // On ne marque "notifié" que si Resend est réellement configuré : sinon un
  // re-run ultérieur (clé en place) pourra envoyer les emails.
  if (isEmailConfigured()) {
    await supabase
      .from("drops")
      .update({ result_notified_at: new Date().toISOString() })
      .eq("id", dropId);
  }

  return NextResponse.json({ ok: true, total: recipients.length, sent, failed });
}
