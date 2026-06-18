import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { sendAvantPremiere, emailLocale } from "@/lib/email/send";
import { isEmailConfigured } from "@/lib/email/client";
import { alertsClient, siteUrl } from "@/lib/alerts";

export const dynamic = "force-dynamic";

/**
 * Push « avant-première » : quand un drop entre dans sa fenêtre de preview, la
 * Liste (waitlist subscribed) reçoit un teaser. Pingé par le cron pg_cron
 * `dispatch_avant_premiere`. Protégé par secret partagé (fail-closed).
 *
 * Idempotence : drops_entering_preview() ne renvoie que les drops non encore
 * poussés ; on marque mark_preview_sent() après envoi, seulement si Resend est
 * configuré (sinon un prochain tick réessaiera une fois la clé en place).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.NOTIFY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "NOTIFY_SECRET non configuré." }, { status: 503 });
  }
  if (request.headers.get("x-notify-secret") !== secret) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: dropRows, error } = await supabase.rpc("drops_entering_preview");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const drops = (dropRows ?? []) as Array<{
    drop_id: string;
    drop_number: number;
    title: string;
    brand_name: string | null;
    opening_at: string;
  }>;

  if (drops.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, sent: 0, failed: 0 });
  }

  // La Liste : abonnés actifs. Même audience pour tous les drops de ce tick.
  // waitlist hors types générés -> client service non typé (comme /api/waitlist).
  const { data: memberRows } = await alertsClient()
    .from("waitlist")
    .select("email, locale, token")
    .eq("status", "subscribed");
  const members = (memberRows ?? []) as Array<{
    email: string;
    locale: string;
    token: string;
  }>;

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const d of drops) {
    for (const m of members) {
      if (!m.email) continue;
      const unsubscribeUrl = `${siteUrl()}/api/waitlist/unsubscribe?token=${m.token}`;
      const res = await sendAvantPremiere(
        m.email,
        {
          dropNumber: d.drop_number,
          title: d.title,
          brandName: d.brand_name,
          openingAt: d.opening_at,
          unsubscribeUrl,
        },
        emailLocale(m.locale)
      );
      if (res.ok) sent++;
      else if (!res.skipped) failed++;
    }

    // Marque l'avant-première poussée (idempotence) seulement si Resend est
    // configuré : sinon on pourra réessayer plus tard sans rien perdre.
    if (isEmailConfigured()) {
      await supabase.rpc("mark_preview_sent", { p_drop_id: d.drop_id });
    }
    processed++;
  }

  return NextResponse.json({ ok: true, processed, sent, failed });
}
