/**
 * Privilège № 001 — logique partagée (voir Privilege_001.md).
 *
 * La formule du supplément vit dans la fonction SQL create_serial_offer
 * (migration 0025) ; cette implémentation TS est son miroir exact, utilisée
 * pour l'affichage, les vérifications et les tests unitaires.
 *
 * Montants en cents (jamais de float) — division entière comme en SQL.
 */

export type SerialOfferStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "refunded";

/**
 * supplément = 50% du spread, plancher 5% du clearing, plafond = spread.
 * Retourne null si aucune offre ne doit exister (spread <= 0).
 * Division entière (troncature vers zéro), identique au BIGINT SQL.
 */
export function computeSupplementCents(
  topBidCents: number,
  clearingCents: number
): number | null {
  const spread = topBidCents - clearingCents;
  if (spread <= 0) return null;
  const half = Math.trunc(spread / 2);
  const floor = Math.trunc((clearingCents * 5) / 100);
  return Math.min(Math.max(half, floor), spread);
}

/** Une offre pending dont l'échéance est passée est traitée comme expirée côté UI. */
export function isOfferActionable(
  status: string,
  expiresAt: string,
  nowMs: number = Date.now()
): boolean {
  return status === "pending" && new Date(expiresAt).getTime() > nowMs;
}

/** Formate « 001/100 » à partir des exemplaires du drop. */
export function formatSerial(serialNo: number, exemplaires: number): string {
  return `${String(serialNo).padStart(3, "0")}/${String(exemplaires).padStart(3, "0")}`;
}
