import Stripe from "stripe";

/**
 * Instance Stripe cote serveur (singleton paresseux). Construite au premier
 * appel uniquement — evite de planter au build quand STRIPE_SECRET_KEY n'est
 * pas encore configuree. Utilisee pour les PaymentIntents en pre-autorisation
 * (manual capture), Stripe Identity (KYC) et les webhooks.
 *
 * Montants toujours en cents (cf. CLAUDE.md conventions).
 */
let stripeSingleton: Stripe | undefined;

export function getStripe(): Stripe {
  if (!stripeSingleton) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY manquante");
    }
    stripeSingleton = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
      appInfo: { name: "Drop No.", url: "https://dropno.com" },
    });
  }
  return stripeSingleton;
}
