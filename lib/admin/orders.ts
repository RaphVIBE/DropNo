import type { Tone } from "./ui";

export type TxStatus = "pending" | "captured" | "refunded" | "failed";
export type DeliveryStatus =
  | "pending" | "preparing" | "shipped" | "in_transit" | "delivered" | "returned" | "lost";
export type Carrier = "dhl" | "malca_amit" | "brinks";

export const TX_FR: Record<TxStatus, string> = {
  pending: "En attente", captured: "Payée", refunded: "Remboursée", failed: "Échouée",
};
export const TX_TONE: Record<TxStatus, Tone> = {
  pending: "amber", captured: "green", refunded: "zinc", failed: "red",
};

export const DELIVERY_FR: Record<DeliveryStatus, string> = {
  pending: "À préparer", preparing: "En préparation", shipped: "Expédiée",
  in_transit: "En transit", delivered: "Livrée", returned: "Retournée", lost: "Perdue",
};
export const DELIVERY_TONE: Record<DeliveryStatus, Tone> = {
  pending: "amber", preparing: "amber", shipped: "violet",
  in_transit: "violet", delivered: "green", returned: "zinc", lost: "red",
};

export const CARRIERS: { value: Carrier; label: string }[] = [
  { value: "dhl", label: "DHL" },
  { value: "malca_amit", label: "Malca-Amit" },
  { value: "brinks", label: "Brink's" },
];
export const carrierLabel = (c: string | null) =>
  CARRIERS.find((x) => x.value === c)?.label ?? c ?? "—";

// Étapes autorisées du workflow d'expédition (trajet aller).
export const NEXT_DELIVERY: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ["preparing", "shipped"],
  preparing: ["shipped"],
  shipped: ["in_transit", "delivered"],
  in_transit: ["delivered", "lost"],
  delivered: ["returned"],
  returned: [],
  lost: [],
};

export const isValidCarrier = (c: string): c is Carrier =>
  c === "dhl" || c === "malca_amit" || c === "brinks";

// ── Direction (0025) : aller vs retour rétractation ─────────────────────────
export type DeliveryDirection = "outbound" | "return";

export const parseDirection = (v: string | null | undefined): DeliveryDirection =>
  v === "return" ? "return" : "outbound";

// Mêmes statuts DB, sémantique différente côté retour : le client renvoie,
// « delivered » = pièce reçue (chez nous / la maison).
export const RETURN_FR: Record<DeliveryStatus, string> = {
  pending: "À organiser",
  preparing: "Étiquette envoyée",
  shipped: "Déposée par le client",
  in_transit: "En transit",
  delivered: "Reçue",
  returned: "—",
  lost: "Perdue",
};

export const deliveryLabel = (direction: DeliveryDirection, s: DeliveryStatus) =>
  direction === "return" ? RETURN_FR[s] : DELIVERY_FR[s];

const NEXT_RETURN: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ["preparing", "shipped"],
  preparing: ["shipped"],
  shipped: ["in_transit", "delivered"],
  in_transit: ["delivered", "lost"],
  delivered: [],
  returned: [],
  lost: [],
};

export const nextDeliverySteps = (direction: DeliveryDirection, s: DeliveryStatus) =>
  (direction === "return" ? NEXT_RETURN : NEXT_DELIVERY)[s] ?? [];

/** Lien de suivi public quand le transporteur en a un (DHL). */
export function trackingUrl(carrier: string | null, tracking: string | null): string | null {
  if (!tracking) return null;
  if (carrier === "dhl")
    return `https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=${encodeURIComponent(tracking)}`;
  return null; // Malca-Amit / Brink's : suivi hors ligne (concierge)
}
