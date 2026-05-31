import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Loader Stripe.js cote navigateur (singleton).
 * Utilise pour Stripe Elements (saisie carte) et Stripe Identity.
 */
let stripePromise: Promise<Stripe | null> | undefined;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
    );
  }
  return stripePromise;
}
