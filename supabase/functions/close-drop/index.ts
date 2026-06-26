// =====================================================================
// Drop No. — Edge function close-drop
// =====================================================================
// Appelée pour révéler un drop à reveal_at.
//
// Étapes :
//   1. Appel SQL close_drop(drop_id) — résolution atomique des bids,
//      détermination du clearing price, création des transactions.
//   2. Pour chaque gagnant : capture du paiement Stripe au clearing price
//      (peut être < bid amount → l'acheteur paye moins que son offre).
//   3. Pour chaque perdant : annulation de la pré-autorisation Stripe.
//   4. Met à jour bids.stripe_auth_status en conséquence.
//
// Idempotente : safe à appeler plusieurs fois pour le même drop.
// Les bids déjà processed (stripe_auth_status='captured' ou 'released')
// sont skip.
//
// v2 : chaque exécution persiste son rapport dans drop_close_runs
// (service role, lu par /admin/cloture). Body accepte triggered_by
// ('cron' par défaut, 'admin' pour une relance manuelle).
//
// v3 : après les captures, tente create_serial_offer (Privilège № 001,
// voir Privilege_001.md). Si une offre est créée, déclenche l'email privé
// via l'app Next. Best-effort, idempotent (une offre max par drop).
//
// Auth : appelée par service_role uniquement (cron Supabase, ou server
// action admin pour la relance).
// =====================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@16.0.0?target=denonext";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
// URL de l'app Next + secret partagé pour déclencher les emails de résultat.
const APP_URL = Deno.env.get("APP_URL") ?? "";
const NOTIFY_SECRET = Deno.env.get("NOTIFY_SECRET") ?? "";

// Lazy init pour ne pas crash au cold start si STRIPE_SECRET_KEY pas encore configurée.
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  if (!stripe) {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return stripe;
}

interface BidRow {
  id: string;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  stripe_auth_status: string;
  status: string;
}

interface CloseResult {
  status: "revealed" | "cancelled";
  clearing_price_cents?: number;
  winners_count?: number;
  exemplaires?: number;
  revealed_at?: string;
  reason?: string;
  already_processed?: boolean;
}

interface SerialOfferResult {
  created: boolean;
  reason?: string;
  offer_id?: string;
  user_id?: string;
  supplement_cents?: number;
  expires_at?: string;
}

interface ProcessReport {
  drop_id: string;
  close_result: CloseResult;
  captures: { success: number; failed: number; skipped: number };
  releases: { success: number; failed: number; skipped: number };
  serial_offer?: SerialOfferResult;
  errors: Array<{ bid_id: string; action: string; message: string }>;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }
  if (!isAuthorizedCaller(req)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { drop_id?: string; triggered_by?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.drop_id) {
    return json({ error: "Missing drop_id" }, 400);
  }
  const triggeredBy: "cron" | "admin" = body.triggered_by === "admin" ? "admin" : "cron";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const report = await processDrop(supabase, body.drop_id);
    await persistRun(supabase, body.drop_id, triggeredBy, report);
    // Emails de résultat (US-22) : seulement si le drop est révélé. Best-effort,
    // n'altère jamais le résultat de la clôture financière.
    if (report.close_result.status === "revealed") {
      await notifyResults(body.drop_id);
    }
    // Privilège № 001 : email privé au top bidder si une offre vient d'être créée.
    if (report.serial_offer?.created && report.serial_offer.offer_id) {
      await notifySerialOffer(report.serial_offer.offer_id);
    }
    return json(report, 200);
  } catch (err) {
    console.error("[close-drop] fatal", err);
    const message = err instanceof Error ? err.message : String(err);
    await persistRun(supabase, body.drop_id, triggeredBy, null, message);
    return json({ error: message }, 500);
  }
});

// Persiste le rapport d'exécution dans drop_close_runs (console admin).
// Best-effort : un échec d'écriture ne doit jamais faire échouer la clôture.
async function persistRun(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  dropId: string,
  triggeredBy: "cron" | "admin",
  report: ProcessReport | null,
  fatalError?: string,
): Promise<void> {
  try {
    const ok = !fatalError && !!report && report.errors.length === 0;
    const { error } = await supabase.from("drop_close_runs").insert({
      drop_id: dropId,
      triggered_by: triggeredBy,
      ok,
      close_status: report?.close_result?.status ?? null,
      report: report ?? { fatal: fatalError ?? "unknown" },
    });
    if (error) console.error("[close-drop] persistRun failed", error.message);
  } catch (e) {
    console.error("[close-drop] persistRun exception", e);
  }
}

async function processDrop(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  dropId: string,
): Promise<ProcessReport> {
  const report: ProcessReport = {
    drop_id: dropId,
    close_result: { status: "cancelled" },
    captures: { success: 0, failed: 0, skipped: 0 },
    releases: { success: 0, failed: 0, skipped: 0 },
    errors: [],
  };

  // ---- Step 1 : SQL close_drop (atomique) ----
  const { data: closeData, error: closeError } = await supabase.rpc(
    "close_drop",
    { p_drop_id: dropId },
  );

  if (closeError) {
    throw new Error(`close_drop SQL failed : ${closeError.message}`);
  }

  report.close_result = closeData as CloseResult;

  // Cas annulation : release toutes les pré-auth
  if (report.close_result.status === "cancelled") {
    await releaseAllForDrop(supabase, dropId, report);
    return report;
  }

  // ---- Step 2 : Capture les gagnants au clearing price ----
  const clearingPrice = report.close_result.clearing_price_cents!;

  const { data: winners } = await supabase
    .from("bids")
    .select("id, stripe_payment_intent_id, amount_cents, stripe_auth_status, status")
    .eq("drop_id", dropId)
    .eq("status", "won");

  // Stripe init paresseuse au niveau du bid : un re-run où tout est déjà
  // capturé/relâché (idempotence) n'exige pas STRIPE_SECRET_KEY.
  for (const bid of (winners ?? []) as BidRow[]) {
    if (!bid.stripe_payment_intent_id) {
      report.captures.skipped++;
      continue;
    }
    if (bid.stripe_auth_status === "captured") {
      report.captures.skipped++;
      continue;
    }

    try {
      await getStripe().paymentIntents.capture(bid.stripe_payment_intent_id, {
        amount_to_capture: clearingPrice,
      });
      await supabase
        .from("bids")
        .update({ stripe_auth_status: "captured" })
        .eq("id", bid.id);
      await supabase
        .from("transactions")
        .update({ status: "captured", captured_at: new Date().toISOString() })
        .eq("bid_id", bid.id);
      report.captures.success++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      report.captures.failed++;
      report.errors.push({ bid_id: bid.id, action: "capture", message });
      await supabase
        .from("bids")
        .update({ stripe_auth_status: "failed" })
        .eq("id", bid.id);
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("bid_id", bid.id);
    }
  }

  // ---- Step 3 : Release les pré-auth des perdants ----
  const { data: losers } = await supabase
    .from("bids")
    .select("id, stripe_payment_intent_id, amount_cents, stripe_auth_status, status")
    .eq("drop_id", dropId)
    .eq("status", "lost");

  for (const bid of (losers ?? []) as BidRow[]) {
    if (!bid.stripe_payment_intent_id) {
      report.releases.skipped++;
      continue;
    }
    if (bid.stripe_auth_status === "released") {
      report.releases.skipped++;
      continue;
    }

    try {
      await getStripe().paymentIntents.cancel(bid.stripe_payment_intent_id);
      await supabase
        .from("bids")
        .update({ stripe_auth_status: "released" })
        .eq("id", bid.id);
      report.releases.success++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      report.releases.failed++;
      report.errors.push({ bid_id: bid.id, action: "release", message });
    }
  }

  // ---- Step 4 : Privilège № 001 (best-effort) ----
  // La fonction SQL vérifie elle-même les conditions (top bid capturé,
  // spread > 0, pas d'ex aequo) et est idempotente (une offre max par drop).
  try {
    const { data: offerData, error: offerError } = await supabase.rpc(
      "create_serial_offer",
      { p_drop_id: dropId },
    );
    if (offerError) {
      report.serial_offer = { created: false, reason: `rpc_error: ${offerError.message}` };
    } else {
      report.serial_offer = offerData as SerialOfferResult;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    report.serial_offer = { created: false, reason: `exception: ${message}` };
  }

  return report;
}

async function releaseAllForDrop(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  dropId: string,
  report: ProcessReport,
): Promise<void> {
  const { data: bids } = await supabase
    .from("bids")
    .select("id, stripe_payment_intent_id, stripe_auth_status")
    .eq("drop_id", dropId)
    .in("status", ["invalid", "withdrawn", "lost"]);

  for (const bid of (bids ?? []) as BidRow[]) {
    if (!bid.stripe_payment_intent_id) {
      report.releases.skipped++;
      continue;
    }
    if (bid.stripe_auth_status === "released" || bid.stripe_auth_status === "captured") {
      report.releases.skipped++;
      continue;
    }

    try {
      await getStripe().paymentIntents.cancel(bid.stripe_payment_intent_id);
      await supabase
        .from("bids")
        .update({ stripe_auth_status: "released" })
        .eq("id", bid.id);
      report.releases.success++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      report.releases.failed++;
      report.errors.push({ bid_id: bid.id, action: "release", message });
    }
  }
}

// Déclenche les emails de résultat via l'app Next (source unique des templates
// + Resend). Best-effort : tout échec est loggé sans interrompre la clôture.
async function notifyResults(dropId: string): Promise<void> {
  if (!APP_URL || !NOTIFY_SECRET) {
    console.warn("[close-drop] APP_URL/NOTIFY_SECRET absents, emails non déclenchés");
    return;
  }
  try {
    const res = await fetch(`${APP_URL}/api/notifications/drop-results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-notify-secret": NOTIFY_SECRET,
      },
      body: JSON.stringify({ dropId }),
    });
    if (!res.ok) {
      console.error("[close-drop] notify résultat échec", res.status, await res.text());
    }
  } catch (err) {
    console.error("[close-drop] notify résultat exception", err);
  }
}

// Déclenche l'email privé du Privilège № 001 via l'app Next. Best-effort.
async function notifySerialOffer(offerId: string): Promise<void> {
  if (!APP_URL || !NOTIFY_SECRET) {
    console.warn("[close-drop] APP_URL/NOTIFY_SECRET absents, email privilège non déclenché");
    return;
  }
  try {
    const res = await fetch(`${APP_URL}/api/notifications/serial-offer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-notify-secret": NOTIFY_SECRET,
      },
      body: JSON.stringify({ offerId }),
    });
    if (!res.ok) {
      console.error("[close-drop] notify privilège échec", res.status, await res.text());
    }
  } catch (err) {
    console.error("[close-drop] notify privilège exception", err);
  }
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Comparaison à temps constant pour éviter toute fuite par timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Autorise l'appelant : tous les invocateurs légitimes (cron pg_net, server
 * action admin de relance) envoient déjà `Authorization: Bearer <service_role>`.
 * Le gateway `verify_jwt` accepte aussi la clé anon (publique) : ce contrôle
 * dans le corps de la fonction borne réellement l'accès au service role.
 */
function isAuthorizedCaller(req: Request): boolean {
  if (!SERVICE_ROLE_KEY) return false;
  const header = req.headers.get("authorization") ?? "";
  return safeEqual(header, `Bearer ${SERVICE_ROLE_KEY}`);
}
