import type { Tone } from "./ui";

// Domaine console de clôture : labels, états de règlement Stripe par bid,
// agrégation « que reste-t-il à faire » pour un drop révélé/annulé.

// ── Statuts Stripe d'un bid ─────────────────────────────────────────────────
export type AuthStatus = "pending" | "authorized" | "captured" | "failed" | "released";

export const AUTH_FR: Record<AuthStatus, string> = {
  pending: "Jamais autorisé",
  authorized: "Pré-autorisé",
  captured: "Capturé",
  failed: "Échec capture",
  released: "Relâché",
};

export const AUTH_TONE: Record<AuthStatus, Tone> = {
  pending: "zinc",
  authorized: "amber",
  captured: "green",
  failed: "red",
  released: "zinc",
};

// ── Statuts métier d'un bid ─────────────────────────────────────────────────
export type BidStatus = "active" | "withdrawn" | "won" | "lost" | "invalid";

export const BID_FR: Record<BidStatus, string> = {
  active: "Active",
  withdrawn: "Retirée",
  won: "Gagnante",
  lost: "Perdante",
  invalid: "Invalide",
};

export const BID_TONE: Record<BidStatus, Tone> = {
  active: "green",
  withdrawn: "zinc",
  won: "champagne",
  lost: "zinc",
  invalid: "red",
};

// ── Santé des crons ─────────────────────────────────────────────────────────
export type CronHealth = {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null; // 'succeeded' | 'failed' | null (jamais exécuté)
  last_message: string;
  failures_24h: number;
};

export const CRON_LABELS: Record<string, string> = {
  dispatch_ripe_drops_every_minute: "Clôture des drops",
  open_ripe_drops_every_minute: "Ouverture des drops",
  dispatch_reminders_every_5_min: "Rappels enchérisseurs",
};

export const cronLabel = (jobname: string) => CRON_LABELS[jobname] ?? jobname;

/** Un cron est en bonne santé : actif, dernier run réussi, pas d'échec sur 24h. */
export const cronHealthy = (c: CronHealth) =>
  c.active && c.last_status === "succeeded" && c.failures_24h === 0;

// ── Règlement d'un drop ─────────────────────────────────────────────────────
export type SettleBid = {
  status: string;
  stripe_auth_status: string;
  stripe_payment_intent_id: string | null;
};

export type Settlement = {
  captured: number; // gagnants capturés
  capturesFailed: number; // gagnants en échec Stripe → relance
  capturesPending: number; // gagnants jamais capturés (pending/authorized) → relance
  released: number; // pré-auths relâchées
  releasesPending: number; // perdants/retirés/invalides encore pré-autorisés → relance
  needsAction: boolean;
};

/**
 * Que reste-t-il à régler côté Stripe ? Un bid sans PaymentIntent est ignoré
 * (rien à capturer ni relâcher). Pertinent uniquement post-reveal/annulation :
 * avant, tous les bids sont 'active'.
 */
export function settlement(bids: SettleBid[]): Settlement {
  const s: Settlement = {
    captured: 0,
    capturesFailed: 0,
    capturesPending: 0,
    released: 0,
    releasesPending: 0,
    needsAction: false,
  };
  for (const b of bids) {
    if (!b.stripe_payment_intent_id) continue;
    if (b.status === "won") {
      if (b.stripe_auth_status === "captured") s.captured++;
      else if (b.stripe_auth_status === "failed") s.capturesFailed++;
      else s.capturesPending++;
    } else if (b.status === "lost" || b.status === "invalid" || b.status === "withdrawn") {
      if (b.stripe_auth_status === "released") s.released++;
      else if (b.stripe_auth_status === "authorized" || b.stripe_auth_status === "failed")
        s.releasesPending++;
    }
  }
  s.needsAction = s.capturesFailed + s.capturesPending + s.releasesPending > 0;
  return s;
}

/** Reveal dépassé mais clôture pas encore aboutie (cron en retard ou en échec). */
export const closeOverdue = (status: string, revealAt: string, nowMs: number) =>
  (status === "open" || status === "closed") && new Date(revealAt).getTime() <= nowMs;

// ── Rapport d'un run (report JSONB de drop_close_runs) ──────────────────────
export type RunReport = {
  close_result?: { status?: string; clearing_price_cents?: number; already_processed?: boolean };
  captures?: { success: number; failed: number; skipped: number };
  releases?: { success: number; failed: number; skipped: number };
  errors?: Array<{ bid_id: string; action: string; message: string }>;
  fatal?: string;
};

export function runSummary(r: RunReport): string {
  if (r.fatal) return `Échec fatal : ${r.fatal}`;
  const c = r.captures ?? { success: 0, failed: 0, skipped: 0 };
  const l = r.releases ?? { success: 0, failed: 0, skipped: 0 };
  const parts = [
    `captures ${c.success} ok / ${c.failed} échec / ${c.skipped} skip`,
    `releases ${l.success} ok / ${l.failed} échec / ${l.skipped} skip`,
  ];
  if (r.close_result?.already_processed) parts.push("déjà traité");
  return parts.join(" · ");
}
