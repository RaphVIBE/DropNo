// =====================================================================
// Drop No. — Edge function refund-transaction
// =====================================================================
// Remboursement INTÉGRAL d'une commande (rétractation 14j EU, décision
// verrouillée : pas de restocking fee). Déclenchée depuis le back-office
// (/admin/commandes/[id]) via service role.
//
// Étapes :
//   1. Charge la transaction + le PaymentIntent du bid gagnant.
//   2. stripe.refunds.create({ payment_intent }) — refund total, avec clé
//      d'idempotence `refund-<transaction_id>` (pas de double refund même
//      en cas de double clic / retry réseau).
//   3. transactions.status = 'refunded' ; withdrawal_requests éventuelle
//      → 'refunded'.
//   4. Privilège № 001 : si un supplément a été accepté sur cette
//      transaction, il est remboursé aussi (remboursement intégral,
//      décision verrouillée) — clé d'idempotence `refund-serial-<offer_id>`,
//      serial_offers.status = 'refunded', serial_no libéré.
//   5. Persiste la tentative (ok ou échec) dans refund_runs.
//
// Idempotente : une transaction déjà 'refunded' est skip (already_refunded).
//
// Auth : service role uniquement.
// =====================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@16.0.0?target=denonext";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

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

interface RefundReport {
  transaction_id: string;
  ok: boolean;
  already_refunded?: boolean;
  stripe_refund_id?: string;
  amount_cents?: number;
  serial_offer_refund?: {
    offer_id: string;
    ok: boolean;
    stripe_refund_id?: string;
    amount_cents?: number;
    error?: string;
  };
  error?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }
  if (!isAuthorizedCaller(req)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { transaction_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.transaction_id) {
    return json({ error: "Missing transaction_id" }, 400);
  }
  const txId = body.transaction_id;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const report: RefundReport = { transaction_id: txId, ok: false };

  try {
    // ---- 1. Transaction + PaymentIntent ----
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("id, status, amount_paid_cents, bid_id, bids(stripe_payment_intent_id)")
      .eq("id", txId)
      .maybeSingle();

    if (txError) throw new Error(`lecture transaction : ${txError.message}`);
    if (!tx) throw new Error("Transaction introuvable");

    if (tx.status === "refunded") {
      report.ok = true;
      report.already_refunded = true;
      await persistRun(supabase, report);
      return json(report, 200);
    }
    if (tx.status !== "captured") {
      throw new Error(`Statut transaction inattendu : ${tx.status} (seul 'captured' est remboursable)`);
    }

    const paymentIntent: string | null = tx.bids?.stripe_payment_intent_id ?? null;
    if (!paymentIntent) throw new Error("Pas de PaymentIntent sur le bid gagnant");

    // ---- 2. Refund Stripe (intégral, idempotent) ----
    const refund = await getStripe().refunds.create(
      { payment_intent: paymentIntent },
      { idempotencyKey: `refund-${txId}` },
    );

    report.stripe_refund_id = refund.id;
    report.amount_cents = refund.amount;
    report.ok = true;

    // ---- 3. Mises à jour DB ----
    const { error: upError } = await supabase
      .from("transactions")
      .update({ status: "refunded" })
      .eq("id", txId);
    if (upError) {
      // Refund Stripe passé mais DB pas à jour : à corriger à la main, le
      // rapport persiste l'incohérence.
      report.error = `Refund Stripe OK mais update transaction échoué : ${upError.message}`;
    }

    await supabase
      .from("withdrawal_requests")
      .update({ status: "refunded", refunded_at: new Date().toISOString() })
      .eq("transaction_id", txId);

    // ---- 4. Privilège № 001 : refund du supplément accepté éventuel ----
    await refundSerialOffer(supabase, txId, report);

    await persistRun(supabase, report);
    return json(report, 200);
  } catch (err) {
    report.error = err instanceof Error ? err.message : String(err);
    console.error("[refund-transaction] fatal", report.error);
    await persistRun(supabase, report);
    return json(report, 500);
  }
});

// Rembourse le supplément Privilège № 001 si l'offre de cette transaction a
// été acceptée et payée. Best-effort : un échec est rapporté dans le run sans
// invalider le remboursement principal (relançable, idempotent).
// deno-lint-ignore no-explicit-any
async function refundSerialOffer(supabase: any, txId: string, report: RefundReport): Promise<void> {
  const { data: offer } = await supabase
    .from("serial_offers")
    .select("id, status, supplement_cents, stripe_payment_intent_id")
    .eq("transaction_id", txId)
    .eq("status", "accepted")
    .maybeSingle();
  if (!offer) return;

  report.serial_offer_refund = { offer_id: offer.id, ok: false };
  try {
    if (offer.stripe_payment_intent_id && offer.stripe_payment_intent_id !== "dev_no_stripe") {
      const refund = await getStripe().refunds.create(
        { payment_intent: offer.stripe_payment_intent_id },
        { idempotencyKey: `refund-serial-${offer.id}` },
      );
      report.serial_offer_refund.stripe_refund_id = refund.id;
      report.serial_offer_refund.amount_cents = refund.amount;
    }

    await supabase
      .from("serial_offers")
      .update({ status: "refunded", resolved_at: new Date().toISOString() })
      .eq("id", offer.id);
    // Le 001 est libéré (la pièce revient).
    await supabase
      .from("transactions")
      .update({ serial_no: null })
      .eq("id", txId);

    report.serial_offer_refund.ok = true;
  } catch (err) {
    report.serial_offer_refund.error = err instanceof Error ? err.message : String(err);
    console.error("[refund-transaction] refund supplément échoué", report.serial_offer_refund.error);
  }
}

// deno-lint-ignore no-explicit-any
async function persistRun(supabase: any, report: RefundReport): Promise<void> {
  try {
    const { error } = await supabase.from("refund_runs").insert({
      transaction_id: report.transaction_id,
      ok: report.ok && !report.error,
      stripe_refund_id: report.stripe_refund_id ?? null,
      amount_cents: report.amount_cents ?? null,
      triggered_by: "admin",
      report,
    });
    if (error) console.error("[refund-transaction] persistRun failed", error.message);
  } catch (e) {
    console.error("[refund-transaction] persistRun exception", e);
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
 * Autorise l'appelant : le seul invocateur légitime (server action admin de
 * remboursement) envoie déjà `Authorization: Bearer <service_role>`. Le gateway
 * `verify_jwt` accepte aussi la clé anon (publique) ; ce contrôle dans le corps
 * borne réellement l'accès au service role — sans lui, n'importe qui muni de la
 * clé publishable pourrait déclencher un refund Stripe avec un transaction_id.
 */
function isAuthorizedCaller(req: Request): boolean {
  if (!SERVICE_ROLE_KEY) return false;
  const header = req.headers.get("authorization") ?? "";
  return safeEqual(header, `Bearer ${SERVICE_ROLE_KEY}`);
}
