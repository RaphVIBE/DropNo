import { describe, expect, it } from "vitest";

import { resolveDrop, type ClearingBid } from "@/lib/clearing";

// Miroir TS de close_drop v4 (migration 0032) : uniform price, N-ième bid
// clearing, vente partielle par défaut, option tout ou rien.

const bid = (id: string, eur: number, t = 0): ClearingBid => ({
  id,
  amountCents: eur * 100,
  submittedAt: t,
});

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
