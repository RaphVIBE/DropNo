import { describe, expect, it } from "vitest";

import {
  resolveDrop,
  type BidAuthStatus,
  type ClearingBid,
} from "@/lib/clearing";

// Miroir TS de close_drop v5 (migration 0037) : uniform price, N-ième bid
// clearing, vente partielle par défaut, option tout ou rien, filtre carte
// autorisée (stripe_auth_status = 'authorized').

const bid = (id: string, eur: number, t = 0): ClearingBid => ({
  id,
  amountCents: eur * 100,
  submittedAt: t,
});

// Offre avec un statut d'autorisation Stripe explicite (Ligne de tir L2).
const bidAuth = (
  id: string,
  eur: number,
  authStatus: BidAuthStatus,
  t = 0,
): ClearingBid => ({ id, amountCents: eur * 100, submittedAt: t, authStatus });

const FLOOR = 300_000; // 3 000 €

describe("resolveDrop — cas pleinement souscrit", () => {
  it("5 exemplaires, 7 offres : 5 gagnants, clearing = 5e offre", () => {
    const bids = [
      bid("a", 6200), bid("b", 5400), bid("c", 4900), bid("d", 4600),
      bid("e", 4100), bid("f", 3800), bid("g", 3200),
    ];
    const r = resolveDrop(bids, { exemplaires: 5, floorPriceCents: FLOOR });
    expect(r.status).toBe("revealed");
    if (r.status !== "revealed") return;
    expect(r.clearingPriceCents).toBe(410_000);
    expect(r.winnersCount).toBe(5);
    expect(r.partial).toBe(false);
    expect(r.winnerIds).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("tie-break : à montant égal, la soumission la plus ancienne gagne", () => {
    const bids = [
      bid("tard", 4100, 200),
      bid("tot", 4100, 100),
      bid("haut", 5000, 50),
    ];
    const r = resolveDrop(bids, { exemplaires: 2, floorPriceCents: FLOOR });
    expect(r.status).toBe("revealed");
    if (r.status !== "revealed") return;
    expect(r.winnerIds).toEqual(["haut", "tot"]);
    expect(r.clearingPriceCents).toBe(410_000);
  });
});

describe("resolveDrop — sous-souscription (K < N)", () => {
  const bids = [bid("a", 6200), bid("b", 5400), bid("c", 4900)];

  it("défaut : vente partielle des K exemplaires au K-ième bid", () => {
    const r = resolveDrop(bids, { exemplaires: 5, floorPriceCents: FLOOR });
    expect(r.status).toBe("revealed");
    if (r.status !== "revealed") return;
    expect(r.winnersCount).toBe(3);
    expect(r.clearingPriceCents).toBe(490_000); // la plus basse gagnante
    expect(r.partial).toBe(true);
  });

  it("all_or_nothing : annulation tant que K < N", () => {
    const r = resolveDrop(bids, {
      exemplaires: 5,
      floorPriceCents: FLOOR,
      allOrNothing: true,
    });
    expect(r.status).toBe("cancelled");
    if (r.status !== "cancelled") return;
    expect(r.reason).toBe("all_or_nothing_undersubscribed");
    expect(r.bidsAboveFloor).toBe(3);
  });

  it("all_or_nothing pile à N : vendu normalement", () => {
    const r = resolveDrop(bids, {
      exemplaires: 3,
      floorPriceCents: FLOOR,
      allOrNothing: true,
    });
    expect(r.status).toBe("revealed");
    if (r.status !== "revealed") return;
    expect(r.partial).toBe(false);
    expect(r.clearingPriceCents).toBe(490_000);
  });
});

describe("resolveDrop — filtre carte autorisée (L2)", () => {
  it("une offre la plus haute mais non autorisée ne gagne jamais", () => {
    // 'pending' = pré-autorisation Stripe jamais aboutie : exclue.
    const bids = [
      bidAuth("pending_haut", 6200, "pending"),
      bidAuth("ok_a", 5400, "authorized"),
      bidAuth("ok_b", 4900, "authorized"),
    ];
    const r = resolveDrop(bids, { exemplaires: 2, floorPriceCents: FLOOR });
    expect(r.status).toBe("revealed");
    if (r.status !== "revealed") return;
    expect(r.winnerIds).toEqual(["ok_a", "ok_b"]);
    expect(r.winnerIds).not.toContain("pending_haut");
    // clearing = K-ième offre AUTORISÉE, jamais fixé par l'offre 'pending'.
    expect(r.clearingPriceCents).toBe(490_000);
  });

  it("statuts non capturables (failed/released) écartés comme pending", () => {
    const bids = [
      bidAuth("failed", 7000, "failed"),
      bidAuth("released", 6800, "released"),
      bidAuth("ok", 4100, "authorized"),
    ];
    const r = resolveDrop(bids, { exemplaires: 3, floorPriceCents: FLOOR });
    expect(r.status).toBe("revealed");
    if (r.status !== "revealed") return;
    expect(r.winnerIds).toEqual(["ok"]);
    expect(r.winnersCount).toBe(1);
    expect(r.clearingPriceCents).toBe(410_000);
  });

  it("clearing recule à l'offre autorisée suivante quand la N-ième est pending", () => {
    // 3 exemplaires, la 3e plus haute est 'pending' → clearing remonte à la
    // 4e offre (autorisée), pas au montant de l'offre non capturable.
    const bids = [
      bidAuth("a", 6200, "authorized"),
      bidAuth("b", 5400, "authorized"),
      bidAuth("c_pending", 4900, "pending"),
      bidAuth("d", 4600, "authorized"),
    ];
    const r = resolveDrop(bids, { exemplaires: 3, floorPriceCents: FLOOR });
    expect(r.status).toBe("revealed");
    if (r.status !== "revealed") return;
    expect(r.winnerIds).toEqual(["a", "b", "d"]);
    expect(r.clearingPriceCents).toBe(460_000); // d, pas c_pending (490 000)
    expect(r.partial).toBe(false);
  });

  it("zéro offre autorisée au-dessus du plancher : annulation", () => {
    const bids = [
      bidAuth("a", 6200, "pending"),
      bidAuth("b", 5400, "failed"),
    ];
    const r = resolveDrop(bids, { exemplaires: 2, floorPriceCents: FLOOR });
    expect(r.status).toBe("cancelled");
    if (r.status !== "cancelled") return;
    expect(r.reason).toBe("insufficient_bids");
    expect(r.bidsAboveFloor).toBe(0);
  });

  it("all_or_nothing : assez d'offres actives mais trop peu autorisées → annulation", () => {
    const bids = [
      bidAuth("a", 6200, "authorized"),
      bidAuth("b", 5400, "authorized"),
      bidAuth("c", 4900, "pending"), // active mais non capturable
    ];
    const r = resolveDrop(bids, {
      exemplaires: 3,
      floorPriceCents: FLOOR,
      allOrNothing: true,
    });
    expect(r.status).toBe("cancelled");
    if (r.status !== "cancelled") return;
    expect(r.reason).toBe("all_or_nothing_undersubscribed");
    expect(r.bidsAboveFloor).toBe(2); // seules les 2 autorisées comptent
  });

  it("rétrocompat : sans authStatus, une offre est traitée comme autorisée", () => {
    const bids = [bid("a", 6200), bid("b", 4100)];
    const r = resolveDrop(bids, { exemplaires: 2, floorPriceCents: FLOOR });
    expect(r.status).toBe("revealed");
    if (r.status !== "revealed") return;
    expect(r.winnerIds).toEqual(["a", "b"]);
  });
});

describe("resolveDrop — annulation", () => {
  it("zéro offre au-dessus du plancher : annulation", () => {
    const bids = [bid("a", 2500), bid("b", 2000)]; // < 3 000 €
    const r = resolveDrop(bids, { exemplaires: 3, floorPriceCents: FLOOR });
    expect(r.status).toBe("cancelled");
    if (r.status !== "cancelled") return;
    expect(r.reason).toBe("insufficient_bids");
    expect(r.bidsAboveFloor).toBe(0);
  });

  it("les offres sous le plancher sont ignorées", () => {
    const bids = [bid("a", 6200), bid("low", 1000)];
    const r = resolveDrop(bids, { exemplaires: 2, floorPriceCents: FLOOR });
    expect(r.status).toBe("revealed");
    if (r.status !== "revealed") return;
    expect(r.winnersCount).toBe(1);
    expect(r.winnerIds).toEqual(["a"]);
  });
});
