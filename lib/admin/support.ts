import type { Tone } from "./ui";

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type Priority = "low" | "normal" | "high" | "urgent";
export type Category = "order" | "delivery" | "kyc" | "payment" | "bid" | "other";

export const STATUS_FR: Record<TicketStatus, string> = {
  open: "Ouvert", pending: "En attente client", resolved: "Résolu", closed: "Fermé",
};
export const STATUS_TONE: Record<TicketStatus, Tone> = {
  open: "amber", pending: "violet", resolved: "green", closed: "zinc",
};

export const CATEGORY_FR: Record<Category, string> = {
  order: "Commande", delivery: "Livraison", kyc: "KYC", payment: "Paiement", bid: "Enchère", other: "Autre",
};

export const PRIORITY_FR: Record<Priority, string> = {
  low: "Basse", normal: "Normale", high: "Haute", urgent: "Urgente",
};
export const PRIORITY_TONE: Record<Priority, Tone> = {
  low: "zinc", normal: "zinc", high: "amber", urgent: "red",
};

export const STATUSES: TicketStatus[] = ["open", "pending", "resolved", "closed"];
export const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];
export const CATEGORIES: Category[] = ["order", "delivery", "kyc", "payment", "bid", "other"];
