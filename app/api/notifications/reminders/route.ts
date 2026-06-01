import { NextResponse, type NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { sendDropReminder } from "@/lib/email/send";
import { isEmailConfigured } from "@/lib/email/client";

export const dynamic = "force-dynamic";

/**
 * Envoie les rappels événementiels dus (ouverture / T-24h / T-1h, US-22).
 *
 * Endpoint interne pingé par le cron pg_cron `dispatch_reminders` (toutes les
 * 5 min). Protégé par secret partagé (x-notify-secret == NOTIFY_SECRET),
 * fail-closed. La fonction SQL reminders_due() ne renvoie que les rappels non
 * encore envoyés ; on marque drop_notifications après envoi (idempotence +
 * rate-limit 4/drop).
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

  const supabase = createServiceClient();

  const { data: dueRows, error } = await supabase.rpc("reminders_due");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const due = (dueRows ?? []) as Array<{
    drop_id: string;
    kind: string;
    drop_number: number;
    title: string;
  }>;

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const d of due) {
    const kind = d.kind as "open" | "h24" | "h1";
    const { data: recs } = await supabase.rpc("drop_notification_recipients", {
      p_drop_id: d.drop_id,
    });
    const recipients = (recs ?? []) as Array<{
      user_id: string;
      email: string | null;
    }>;

    for (const r of recipients) {
      if (!r.email) continue;
      const res = await sendDropReminder(r.email, {
        kind,
        dropNumber: d.drop_number,
        title: d.title,
      });
      if (res.ok) sent++;
      else failed++;
    }

    // Marque le rappel envoyé seulement si Resend est configuré : sinon un
    // prochain tick pourra réessayer une fois la clé en place.
    if (isEmailConfigured()) {
      await supabase
        .from("drop_notifications")
        .upsert(
          { drop_id: d.drop_id, kind },
          { onConflict: "drop_id,kind", ignoreDuplicates: true }
        );
    }
    processed++;
  }

  return NextResponse.json({ ok: true, processed, sent, failed });
}
