import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { alertsClient, isValidEmail, newAlertToken } from "@/lib/alerts";

export const dynamic = "force-dynamic";

/**
 * Inscription à la liste d'attente (soft launch, visiteur sans compte).
 * Opt-in simple + consentement marketing explicite. Réponse volontairement
 * uniforme (on ne révèle pas si l'email est déjà inscrit). Service role only.
 */
export async function POST(request: NextRequest) {
  let body: { email?: unknown; consent?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "consent_required" }, { status: 400 });
  }

  const locale = cookies().get("NEXT_LOCALE")?.value === "en" ? "en" : "fr";
  const source =
    typeof body.source === "string" ? body.source.slice(0, 40) : null;

  const db = alertsClient();
  const { error } = await db.from("waitlist").upsert(
    {
      email,
      locale,
      status: "subscribed",
      token: newAlertToken(),
      source,
      unsubscribed_at: null,
    },
    { onConflict: "email" }
  );

  if (error) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
