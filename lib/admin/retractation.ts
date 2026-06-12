import type { Tone } from "./ui";

// Domaine rétractation 14j EU (décision verrouillée : remboursement intégral).
// Workflow par commande : requested → return_in_transit → received →
// refunded | rejected. Le refund Stripe passe par l'edge function
// refund-transaction (jamais Stripe depuis le back-office).

export type WithdrawalStatus =
  | "requested" | "return_in_transit" | "received" | "refunded" | "rejected";

export const WITHDRAWAL_FR: Record<WithdrawalStatus, string> = {
  requested: "Demandée",
  return_in_transit: "Retour en transit",
  received: "Pièce reçue",
  refunded: "Remboursée",
  rejected: "Refusée",
};

export const WITHDRAWAL_TONE: Record<WithdrawalStatus, Tone> = {
  requested: "amber",
  return_in_transit: "amber",
  received: "violet",
  refunded: "green",
  rejected: "red",
};

/** Transitions d'avancement manuel (hors refund/refus qui ont leurs actions). */
export const NEXT_WITHDRAWAL: Record<WithdrawalStatus, WithdrawalStatus[]> = {
  requested: ["return_in_transit", "received"],
  return_in_transit: ["received"],
  received: [],
  refunded: [],
  rejected: [],
};

/** Le refus reste possible tant que rien d'irréversible n'est fait. */
export const canReject = (s: WithdrawalStatus) =>
  s === "requested" || s === "return_in_transit" || s === "received";

/** Le refund ne se déclenche qu'après inspection de la pièce reçue. */
export const canRefund = (s: WithdrawalStatus) => s === "received";

export type RefundRunRow = {
  id: number;
  ok: boolean;
  stripe_refund_id: string | null;
  amount_cents: number | null;
  report: unknown;
  created_at: string;
};

export const refundRunError = (report: unknown): string | null => {
  if (report && typeof report === "object" && "error" in report) {
    const e = (report as { error?: unknown }).error;
    return typeof e === "string" ? e : null;
  }
  return null;
};
