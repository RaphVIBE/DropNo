import type { Tone } from "./ui";

// Domaine finance : calcul du dû maison par drop révélé.
// Source de vérité = transactions (les montants fee/payout sont posés par
// close_drop au clearing price). On agrège ici, on ne recalcule pas les %.

export type TxLite = {
  status: string; // 'pending' | 'captured' | 'refunded' | 'failed'
  amount_paid_cents: number;
  platform_fee_cents: number;
  brand_payout_cents: number;
  withdrawal_window_ends_at: string | null;
};

// Privilège № 001 : supplément encaissé en sus du clearing (Privilege_001.md).
// Fee plateforme : 12% du supplément, pas de 5€ fixes additionnels (déjà
// comptés sur la transaction principale).
export type SerialOfferLite = {
  status: string; // 'pending' | 'accepted' | 'declined' | 'expired' | 'refunded'
  supplement_cents: number;
};

export const SUPPLEMENT_FEE_RATE = 0.12;

export function supplementFeeCents(supplementCents: number): number {
  return Math.round(supplementCents * SUPPLEMENT_FEE_RATE);
}

export type PayoutComputed = {
  units: number; // tx capturées
  refunds: number; // tx remboursées
  pendingTx: number; // tx pending/failed (capture non aboutie)
  grossCents: number; // CA capturé
  feeCents: number; // commission plateforme
  netCents: number; // dû maison
  retractationEndsAt: string | null; // max fenêtre 14j des tx capturées
  inRetractation: boolean;
};

export function computePayout(
  txs: TxLite[],
  nowMs: number,
  serialOffers: SerialOfferLite[] = []
): PayoutComputed {
  const out: PayoutComputed = {
    units: 0, refunds: 0, pendingTx: 0,
    grossCents: 0, feeCents: 0, netCents: 0,
    retractationEndsAt: null, inRetractation: false,
  };
  for (const t of txs) {
    if (t.status === "captured") {
      out.units++;
      out.grossCents += t.amount_paid_cents;
      out.feeCents += t.platform_fee_cents;
      out.netCents += t.brand_payout_cents;
      if (t.withdrawal_window_ends_at &&
          (!out.retractationEndsAt || t.withdrawal_window_ends_at > out.retractationEndsAt)) {
        out.retractationEndsAt = t.withdrawal_window_ends_at;
      }
    } else if (t.status === "refunded") {
      out.refunds++;
    } else {
      out.pendingTx++;
    }
  }
  // Supplément Privilège № 001 (accepted uniquement : refunded/expired = 0).
  for (const o of serialOffers) {
    if (o.status !== "accepted") continue;
    const fee = supplementFeeCents(o.supplement_cents);
    out.grossCents += o.supplement_cents;
    out.feeCents += fee;
    out.netCents += o.supplement_cents - fee;
  }
  out.inRetractation =
    !!out.retractationEndsAt && new Date(out.retractationEndsAt).getTime() > nowMs;
  return out;
}

// ── Statut payout d'un drop révélé ──────────────────────────────────────────
// paid        : virement enregistré (drop_payouts)
// blocked     : règlement Stripe incomplet (tx pending/failed) → régler via /admin/cloture
// retractation: fenêtre 14j en cours → ne pas verser
// payable     : net dû > 0, fenêtre passée, tout capturé
// nothing     : rien à verser (drop annulé, tout remboursé…)
export type PayoutStatus = "paid" | "blocked" | "retractation" | "payable" | "nothing";

export const PAYOUT_FR: Record<PayoutStatus, string> = {
  paid: "Payé",
  blocked: "Bloqué (règlement)",
  retractation: "En rétractation",
  payable: "À payer",
  nothing: "Rien à verser",
};

export const PAYOUT_TONE: Record<PayoutStatus, Tone> = {
  paid: "green",
  blocked: "red",
  retractation: "amber",
  payable: "champagne",
  nothing: "zinc",
};

export function payoutStatus(c: PayoutComputed, paid: boolean): PayoutStatus {
  if (paid) return "paid";
  if (c.pendingTx > 0) return "blocked";
  if (c.netCents <= 0) return "nothing";
  if (c.inRetractation) return "retractation";
  return "payable";
}

/** Écart entre le snapshot payé et le calcul live (remboursement post-virement…). */
export const payoutDelta = (paidNetCents: number, c: PayoutComputed) => paidNetCents - c.netCents;
