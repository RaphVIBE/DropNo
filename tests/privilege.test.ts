import { describe, expect, it } from "vitest";

import {
  computeSupplementCents,
  formatSerial,
  isOfferActionable,
} from "@/lib/privilege";

// Miroir TS de la formule SQL (migration 0025, create_serial_offer) :
// supplément = 50% du spread, plancher 5% du clearing, plafond = spread.
describe("computeSupplementCents", () => {
  it("cas nominal : 50% du spread", () => {
    // bid 9 000 €, clearing 7 000 € -> spread 2 000 €, supplément 1 000 €
    expect(computeSupplementCents(900_000, 700_000)).toBe(100_000);
  });

  it("plancher : 5% du clearing quand le spread est petit", () => {
    // bid 7 400 €, clearing 7 000 € -> spread 400 €, 50% = 200 €,
    // plancher 5% de 7 000 € = 350 € -> 350 €
    expect(computeSupplementCents(740_000, 700_000)).toBe(35_000);
  });

  it("plafond : jamais plus que le spread (total <= bid)", () => {
    // bid 7 100 €, clearing 7 000 € -> spread 100 €, plancher 350 € > spread
    // -> plafonné à 100 € : le total payé reste exactement le bid
    expect(computeSupplementCents(710_000, 700_000)).toBe(10_000);
  });

  it("spread nul : pas d'offre", () => {
    expect(computeSupplementCents(700_000, 700_000)).toBeNull();
  });

  it("spread négatif (défensif) : pas d'offre", () => {
    expect(computeSupplementCents(690_000, 700_000)).toBeNull();
  });

  it("sous-souscription : spread = bid - plancher du drop", () => {
    // tous gagnent à P=3 000 €, top bid 12 000 € -> spread 9 000 €, 50% = 4 500 €
    expect(computeSupplementCents(1_200_000, 300_000)).toBe(450_000);
  });

  it("division entière identique au BIGINT SQL (troncature)", () => {
    // spread impair : 5 001 cents -> 50% = 2 500 (pas 2 500.5)
    // clearing 30 000 cents -> plancher 1 500
    expect(computeSupplementCents(35_001, 30_000)).toBe(2_500);
  });

  it("le total clearing + supplément ne dépasse jamais le bid", () => {
    const cases: Array<[number, number]> = [
      [900_000, 700_000],
      [710_000, 700_000],
      [740_000, 700_000],
      [300_001, 300_000],
      [1_200_000, 300_000],
    ];
    for (const [bid, clearing] of cases) {
      const supp = computeSupplementCents(bid, clearing);
      if (supp !== null) {
        expect(clearing + supp).toBeLessThanOrEqual(bid);
        expect(supp).toBeGreaterThan(0);
      }
    }
  });
});

describe("isOfferActionable", () => {
  const now = Date.parse("2026-06-12T12:00:00Z");

  it("pending et non échue : actionnable", () => {
    expect(isOfferActionable("pending", "2026-06-13T11:00:00Z", now)).toBe(true);
  });

  it("pending mais échue : non actionnable", () => {
    expect(isOfferActionable("pending", "2026-06-12T11:00:00Z", now)).toBe(false);
  });

  it("statuts résolus : non actionnables", () => {
    for (const s of ["accepted", "declined", "expired", "refunded"]) {
      expect(isOfferActionable(s, "2026-06-13T11:00:00Z", now)).toBe(false);
    }
  });
});

describe("formatSerial", () => {
  it("formate 001/100", () => {
    expect(formatSerial(1, 100)).toBe("001/100");
  });
  it("formate 001/050", () => {
    expect(formatSerial(1, 50)).toBe("001/050");
  });
});
