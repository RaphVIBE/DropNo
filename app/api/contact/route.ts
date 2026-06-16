import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { isValidEmail } from "@/lib/alerts";
import { sendContactMessage } from "@/lib/email/send";
import type { ContactReason } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

/**
 * Réception du formulaire /contact. Trois couches anti-spam :
 *  1. Honeypot `website` : rempli -> 200 silencieux, aucun email (on ne signale
 *     pas au bot qu'il est détecté).
 *  2. Rate limit best-effort par IP (5 / heure). En mémoire process : suffisant
 *     contre les rafales d'une même instance ; le honeypot reste la défense
 *     principale. Migrer vers Upstash si du spam distribué apparaît.
 *  3. Validation stricte (enum, longueurs, format email).
 *
 * Routage : reason=brand -> raph@, sinon -> hello@. Reply-To = email visiteur.
 * Envoi best-effort (lib/email) : sans RESEND_API_KEY, no-op + 200.
 */

const REASONS: ContactReason[] = ["brand", "collector", "press", "other"];

const TO_FOR: Record<ContactReason, string> = {
  brand: "raph@dropno.eu",
  collector: "hello@dropno.eu",
  press: "hello@dropno.eu",
  other: "hello@dropno.eu",
};

// Fenêtre glissante en mémoire (best-effort, par instance).
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function field(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // 1. Honeypot : faux succès, aucun envoi.
  if (field(body.website).length > 0) {
    return NextResponse.json({ ok: true });
  }

  // 3. Validation
  const reason = field(body.reason) as ContactReason;
  const name = field(body.name);
  const email = field(body.email).toLowerCase();
  const subject = field(body.subject);
  const message = field(body.message);

  if (!REASONS.includes(reason)) {
    return NextResponse.json({ error: "invalid_reason" }, { status: 400 });
  }
  if (name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (subject.length < 3 || subject.length > 200) {
    return NextResponse.json({ error: "invalid_subject" }, { status: 400 });
  }
  if (message.length < 20 || message.length > 3000) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  // 2. Rate limit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-nf-client-connection-ip") ||
    "anonymous";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const locale = cookies().get("NEXT_LOCALE")?.value === "en" ? "en" : "fr";

  const result = await sendContactMessage(
    TO_FOR[reason],
    { reason, name, email, subject, message },
    email,
    locale
  );

  if (!result.ok && !result.skipped) {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
