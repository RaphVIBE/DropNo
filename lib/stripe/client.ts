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
      appInfo: { name: "Drop No.", url: "https://dropno.eu" },
    });
  }
  return stripeSingleton;
}

/** Valeurs autorisees par la contrainte CHECK bids.stripe_auth_status. */
export type BidAuthStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "released";

/**
 * Mappe un statut de PaymentIntent Stripe vers la contrainte bids.stripe_auth_status.
 * Un PI en capture manuelle est `requires_capture` une fois la carte autorisee
 * (= pre-autorisation posee) ; c'est notre etat `authorized`.
 */
export function mapPaymentIntentStatus(
  status: Stripe.PaymentIntent.Status
): BidAuthStatus {
  switch (status) {
    case "requires_capture":
      return "authorized";
    case "succeeded":
      return "captured";
    case "canceled":
      return "released";
    default:
      // requires_payment_method, requires_confirmation, requires_action, processing
      return "pending";
  }
}
