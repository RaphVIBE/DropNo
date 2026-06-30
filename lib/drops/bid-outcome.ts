/**
 * Machine a etats du resultat acheteur, post-reveal.
 *
 * La route /drop/[id]/result lit l'issue de l'offre de l'utilisateur courant et
 * rend la variante correspondante (cf. mockups/dropno-buyer-reveal-*.html).
 *
 * Quatre variantes sont DESSINEES et implementees ici :
 *   - won_privilege : top bidder, privilege № 001 en attente
 *   - won           : gagnant hors privilege (rangs 2..N)
 *   - outbid        : offre >= plancher mais < clearing
 *   - below_floor   : offre < plancher, jamais entree dans l'enchere
 *
 * Deux etats supplementaires (capture_failed, pending_pre_reveal) sont prevus
 * par le handoff mais PAS encore dessines : ils seront ajoutes a l'etape 4/5.
 *
 * Convention : montants en cents (cf. CLAUDE.md). Aucune logique de prix ici,
 * uniquement de la classification a partir d'un etat deja calcule par le moteur
 * (close_drop) et expose en lecture.
 */

/** Offre de l'utilisateur, telle que renvoyee par le RPC my_bid_for_drop. */
export type BidRow = {
  amount_cents: number;
  status: string;
};

/** Transaction capturee de l'utilisateur pour ce drop (signal de gain le plus sur). */
export type TxRow = {
  amount_paid_cents: number | null;
  captured_at: string | null;
  status: string | null;
} | null;

/** Offre privilege № 001 de l'utilisateur pour ce drop (RLS : la sienne). */
export type SerialOfferRow = {
  id: string;
  status: string;
  supplement_cents: number;
  serial_no: number;
  expires_at: string;
} | null;

export type BidOutcome =
  | {
      kind: "won_privilege";
      clearingCents: number;
      bidCents: number;
      supplementCents: number;
      serialNo: number;
      expiresAt: string;
      offerId: string;
    }
  | { kind: "won"; clearingCents: number; bidCents: number }
  | { kind: "outbid"; clearingCents: number; bidCents: number; floorCents: number }
  | { kind: "below_floor"; bidCents: number; floorCents: number };

/**
 * Determine l'issue a partir de l'etat lu en base. Renvoie `null` si l'issue
 * n'est pas calculable (pas d'offre, ou drop sans clearing alors qu'une victoire
 * serait attendue) : l'appelant redirige alors vers la fiche drop.
 *
 * Signal de gain, par ordre de fiabilite :
 *   1. une transaction capturee existe (capture Stripe passee au reveal) ;
 *   2. le moteur a marque l'offre `won` ;
 *   3. a defaut, comparaison au clearing (offre >= clearing, non marquee perdue).
 */
export function computeBidOutcome(input: {
  bid: BidRow | null;
  tx: TxRow;
  serialOffer: SerialOfferRow;
  clearingCents: number | null;
  floorCents: number | null;
}): BidOutcome | null {
  const { bid, tx, serialOffer, clearingCents, floorCents } = input;
  if (!bid) return null;

  const captured = !!tx && tx.captured_at != null;
  const won =
    captured ||
    bid.status === "won" ||
    (clearingCents != null &&
      bid.amount_cents >= clearingCents &&
      bid.status !== "lost");

  if (won) {
    // Une victoire sans clearing connu n'est pas affichable fidelement.
    if (clearingCents == null) return null;
    if (serialOffer && serialOffer.status === "pending") {
      return {
        kind: "won_privilege",
        clearingCents,
        bidCents: bid.amount_cents,
        supplementCents: serialOffer.supplement_cents,
        serialNo: serialOffer.serial_no,
        expiresAt: serialOffer.expires_at,
        offerId: serialOffer.id,
      };
    }
    return { kind: "won", clearingCents, bidCents: bid.amount_cents };
  }

  // Perdant : sous le plancher (jamais entre) vs au-dessus mais sous le clearing.
  if (floorCents != null && bid.amount_cents < floorCents) {
    return { kind: "below_floor", bidCents: bid.amount_cents, floorCents };
  }
  if (clearingCents == null || floorCents == null) return null;
  return {
    kind: "outbid",
    clearingCents,
    bidCents: bid.amount_cents,
    floorCents,
  };
}
