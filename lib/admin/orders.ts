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

// Étapes autorisées du workflow d'expédition.
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
