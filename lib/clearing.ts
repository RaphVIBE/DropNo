/**
 * Résolution d'un drop — logique partagée (voir db/schema-design.md).
 *
 * L'attribution réelle vit dans la fonction SQL close_drop (migration 0037,
 * v5) ; cette implémentation TS en est le miroir, utilisée pour l'affichage,
 * les vérifications et les tests unitaires.
 *
 * Règle (sealed-bid uniform price, N-ième bid clearing) :
 *   - on ne retient que les offres dont la carte est pré-autorisée
 *     (authStatus = 'authorized') ET >= plancher ;
 *   - on les classe par montant décroissant (tie-break : soumission la plus
 *     ancienne d'abord) ;
 *   - les N premières gagnent (ou les K disponibles si K < N) ;
 *   - clearing = la plus basse offre gagnante (K-ième) ;
 *   - vente partielle par défaut. Si `allOrNothing` et K < N : annulation.
 *   - zéro offre autorisée >= plancher : annulation.
 *
 * Une offre non autorisée (pending/failed/released) ne peut pas être
 * capturée : elle est exclue de la sélection des gagnants, jamais elle ne
 * fixe le clearing. Voir migration 0037 (close_drop v5), Ligne de tir L2.
 *
 * Montants en cents (jamais de float).
 */

// Miroir de bids.stripe_auth_status (0001). Seul 'authorized' est éligible.
export type BidAuthStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "released";

export type ClearingBid = {
  id: string;
  amountCents: number;
  submittedAt: number; // epoch ms, pour le tie-break
  // Défaut 'authorized' : conserve le comportement des appelants qui ne
  // modélisent pas l'autorisation Stripe (affichage agrégé, anciens tests).
  authStatus?: BidAuthStatus;
};

export type ClearingResult =
  | {
      status: "revealed";
      clearingPriceCents: number;
      winnerIds: string[];
      winnersCount: number;
      exemplaires: number;
      partial: boolean;
    }
  | {
      status: "cancelled";
      reason: "insufficient_bids" | "all_or_nothing_undersubscribed";
      bidsAboveFloor: number;
      exemplaires: number;
    };

export function resolveDrop(
  bids: ClearingBid[],
  opts: { exemplaires: number; floorPriceCents: number; allOrNothing?: boolean },
): ClearingResult {
  const { exemplaires, floorPriceCents, allOrNothing = false } = opts;

  const qualified = bids
    .filter(
      (b) =>
        b.amountCents >= floorPriceCents &&
        (b.authStatus ?? "authorized") === "authorized",
    )
    .sort((a, b) =>
      b.amountCents - a.amountCents || a.submittedAt - b.submittedAt,
    );

  const winners = qualified.slice(0, exemplaires);
  const winnersCount = winners.length;

  if (winnersCount === 0) {
    return {
      status: "cancelled",
      reason: "insufficient_bids",
      bidsAboveFloor: 0,
      exemplaires,
    };
  }

  if (allOrNothing && winnersCount < exemplaires) {
    return {
      status: "cancelled",
      reason: "all_or_nothing_undersubscribed",
      bidsAboveFloor: winnersCount,
      exemplaires,
    };
  }

  // clearing = plus basse offre gagnante (dernière du tri = K-ième / N-ième)
  const clearingPriceCents = winners[winnersCount - 1].amountCents;

  return {
    status: "revealed",
    clearingPriceCents,
    winnerIds: winners.map((b) => b.id),
    winnersCount,
    exemplaires,
    partial: winnersCount < exemplaires,
  };
}
