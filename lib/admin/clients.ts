import type { Tone } from "./ui";

export type KycStatus = "pending" | "verifying" | "verified" | "rejected";

export const KYC_FR: Record<KycStatus, string> = {
  pending: "En attente", verifying: "En vérification", verified: "Vérifié", rejected: "Rejeté",
};
export const KYC_TONE: Record<KycStatus, Tone> = {
  pending: "amber", verifying: "amber", verified: "green", rejected: "red",
};
