import type { Tone } from "./ui";

// Règles métier des drops, partagées par les server actions et l'UI.
// Cycle de vie (calé sur les crons) :
//   draft → (publier) → scheduled → [open_ripe_drops] → open
//        → [dispatch_ripe_drops → close-drop] → revealed | cancelled

export type DropStatus = "draft" | "scheduled" | "open" | "closed" | "revealed" | "cancelled";

export const FLOOR_MIN_CENTS = 300_000; // 3 000 € — contrainte DB
export const EXEMPLAIRES_MAX = 100;

export const STATUS_FR: Record<DropStatus, string> = {
  draft: "Brouillon",
  scheduled: "Programmé",
  open: "Ouvert",
  closed: "Verrouillé",
  revealed: "Révélé",
  cancelled: "Annulé",
};

export const STATUS_TONE: Record<DropStatus, Tone> = {
  draft: "zinc",
  scheduled: "amber",
  open: "green",
  closed: "amber",
  revealed: "champagne",
  cancelled: "zinc",
};

// Fenêtres + curation modifiables seulement avant le démarrage de l'enchère.
export const isPlannable = (s: DropStatus) => s === "draft" || s === "scheduled";
export const isEditable = (s: DropStatus) => s !== "revealed" && s !== "cancelled";
export const canPublish = (s: DropStatus) => s === "draft";
export const canCancel = (s: DropStatus) => s === "draft" || s === "scheduled";
export const canDelete = (s: DropStatus) => s === "draft";

export type DropInput = {
  brand_id: string;
  title: string;
  piece_reference: string | null;
  description: string | null;
  floor_price_cents: number;
  exemplaires: number;
  bid_window_opens_at: string;
  bid_lock_at: string | null;
  reveal_at: string;
  hero_image_url: string | null;
  images_urls: string[];
};

export function validateDrop(d: DropInput, opts: { requireFutureReveal?: boolean } = {}): string[] {
  const e: string[] = [];
  if (!d.brand_id) e.push("Une maison est requise.");
  if (!d.title?.trim()) e.push("Le titre est requis.");
  if (!Number.isInteger(d.floor_price_cents) || d.floor_price_cents < FLOOR_MIN_CENTS)
    e.push("Le prix plancher doit être ≥ 3 000 €.");
  if (!Number.isInteger(d.exemplaires) || d.exemplaires < 1 || d.exemplaires > EXEMPLAIRES_MAX)
    e.push("Le nombre d'exemplaires doit être entre 1 et 100.");

  const opens = Date.parse(d.bid_window_opens_at);
  const reveal = Date.parse(d.reveal_at);
  const lock = d.bid_lock_at ? Date.parse(d.bid_lock_at) : null;
  if (Number.isNaN(opens)) e.push("Date d'ouverture invalide.");
  if (Number.isNaN(reveal)) e.push("Date de reveal invalide.");
  if (!Number.isNaN(opens) && !Number.isNaN(reveal) && opens >= reveal)
    e.push("L'ouverture doit précéder le reveal.");
  if (lock != null && !Number.isNaN(lock)) {
    if (lock < opens) e.push("Le verrouillage doit être après l'ouverture.");
    if (lock > reveal) e.push("Le verrouillage doit être au plus tard au reveal.");
  }
  if (opts.requireFutureReveal && !Number.isNaN(reveal) && reveal <= Date.now())
    e.push("Le reveal doit être dans le futur pour publier.");
  return e;
}
