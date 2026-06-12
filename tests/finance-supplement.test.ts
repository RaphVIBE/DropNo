import { describe, expect, it } from "vitest";

import {
  computePayout,
  payoutStatus,
  supplementFeeCents,
  type SerialOfferLite,
  type TxLite,
} from "@/lib/admin/finance";

const NOW = Date.parse("2026-06-12T12:00:00Z");
const PAST = "2026-05-01T00:00:00Z";

const capturedTx = (amount: number): TxLite => ({
  status: "captured",
  amount_paid_cents: amount,
  platform_fee_cents: Math.round(amount * 0.12) + 500,
  brand_payout_cents: amount - (Math.round(amount * 0.12) + 500),
  withdrawal_window_ends_at: PAST,
});

describe("computePayout avec Privilège № 001", () => {
  it("supplément accepté : 12% de fee, pas de 5€ fixes additionnels", () => {
    const txs = [capturedTx(700_000)];
    const offers: SerialOfferLite[] = [
      { status: "accepted", supplement_cents: 100_000 },
    ];
    const base = computePayout(txs, NOW);
    const withOffer = computePayout(txs, NOW, offers);

    expect(withOffer.grossCents).toBe(base.grossCents + 100_000);
    expect(withOffer.feeCents).toBe(base.feeCents + 12_000);
    expect(withOffer.netCents).toBe(base.netCents + 88_000);
  });

  it("offre pending/declined/expired/refunded : aucun impact", () => {
    const txs = [capturedTx(700_000)];
    const base = computePayout(txs, NOW);
    for (const status of ["pending", "declined", "expired", "refunded"]) {
      const c = computePayout(txs, NOW, [
        { status, supplement_cents: 100_000 },
      ]);
      expect(c.netCents).toBe(base.netCents);
      expect(c.grossCents).toBe(base.grossCents);
    }
  });

  it("le statut payout reste piloté par les transactions", () => {
    const txs = [capturedTx(700_000)];
    const c = computePayout(txs, NOW, [
      { status: "accepted", supplement_cents: 100_000 },
    ]);
    expect(payoutStatus(c, false)).toBe("payable");
  });

  it("supplementFeeCents arrondit au cent", () => {
    expect(supplementFeeCents(100_000)).toBe(12_000);
    expect(supplementFeeCents(33_333)).toBe(4_000); // 3 999.96 -> 4 000
  });
});
