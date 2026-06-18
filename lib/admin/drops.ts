import type { Tone } from "./ui";

// Règles métier des drops, partagées par les server actions et l'UI.
// Cycle de vie (calé sur les crons) :
//   draft → (publier) → scheduled → [open_ripe_drops] → open
//        → [dispatch_ripe_drops → close-drop] → revealed | cancelled

export type DropStatus = "draft" | "scheduled" | "open" | "closed" | "revealed" | "cancelled";

export const FLOOR_MIN_CENTS = 300_000; // 3 000 € — contrainte DB
export const EXEMPLAIRES_MAX = 100;

// ── Timeline & formats ──────────────────────────────────────────────────────
// Le reveal est l'ancre (rendez-vous rituel). Tout le reste se dérive du reveal
// via le preset du format choisi :
//   annonce « À venir » ← ouverture (reveal − fenêtre) → … → verrouillage (reveal − 1h) → REVEAL
// Garder ces presets en un seul endroit : ils seront tunés à l'analytique.

const DAY_MS = 86_400_000;
const HOUR_MS = 60 * 60 * 1000;
const shiftIso = (iso: string, ms: number) => new Date(new Date(iso).getTime() + ms).toISOString();

export const REVEAL_WEEKDAY = 4; // jeudi (0 = dimanche) — créneau hebdo fixe
export const REVEAL_HOUR = 18; // 18:00, heure locale

export type DropFormat = "standard" | "exceptionnel";
export const DROP_FORMAT_DEFAULT: DropFormat = "standard";

export type FormatPreset = {
  label: string;
  hint: string;
  windowDays: number; // ouverture = reveal − windowDays
  announceLeadDays: number; // annonce « À venir » = ouverture − announceLeadDays
  previewLeadDays: number; // avant-première (la Liste) = annonce − previewLeadDays
  lockBeforeMs: number; // verrouillage = reveal − lockBeforeMs
  exemplairesHint: number | null; // suggestion d'exemplaires (indicatif)
  offCadence: boolean; // hors créneau hebdo fixe ?
};

export const DROP_FORMATS: Record<DropFormat, FormatPreset> = {
  standard: {
    label: "Standard",
    hint: "Drop hebdo · créneau fixe (jeudi 18:00) · fenêtre de 5 jours.",
    windowDays: 5,
    announceLeadDays: 14,
    previewLeadDays: 7,
    lockBeforeMs: HOUR_MS,
    exemplairesHint: null,
    offCadence: false,
  },
  exceptionnel: {
    label: "Exceptionnel",
    hint: "Pièce rare hors-cadence · runway long · fenêtre de 10 jours.",
    windowDays: 10,
    announceLeadDays: 25,
    previewLeadDays: 14,
    lockBeforeMs: HOUR_MS,
    exemplairesHint: 3,
    offCadence: true,
  },
};

export const parseDropFormat = (v: string | null | undefined): DropFormat =>
  v === "exceptionnel" ? "exceptionnel" : "standard";

export const formatPreset = (f: string | null | undefined): FormatPreset =>
  DROP_FORMATS[parseDropFormat(f)];

// Dérivations à partir du reveal (ancre).
export const openFromReveal = (revealIso: string | null, p: FormatPreset) =>
  revealIso ? shiftIso(revealIso, -p.windowDays * DAY_MS) : "";

export const lockFromReveal = (revealIso: string | null, p: FormatPreset) =>
  revealIso ? shiftIso(revealIso, -p.lockBeforeMs) : "";

/** Annonce « À venir » = ouverture − announceLeadDays (donc reveal − (fenêtre + lead)). */
export const announceFromReveal = (revealIso: string | null, p: FormatPreset) =>
  revealIso ? shiftIso(revealIso, -(p.windowDays + p.announceLeadDays) * DAY_MS) : "";

/** Annonce « À venir » dérivée de l'ouverture (vue publique : on a l'ouverture, pas le reveal). */
export const announceFromOpen = (openIso: string | null, p: FormatPreset) =>
  openIso ? shiftIso(openIso, -p.announceLeadDays * DAY_MS) : "";

/**
 * Un drop programmé n'est mis en avant publiquement (« À venir ») qu'à partir de
 * sa date d'annonce (ouverture − announceLeadDays du format). Source unique des
 * délais : DROP_FORMATS.
 */
export function isAnnounced(openIso: string | null, format: string | null, nowIso: string): boolean {
  const ann = announceFromOpen(openIso, formatPreset(format));
  return !!ann && new Date(nowIso).getTime() >= new Date(ann).getTime();
}

/** Avant-première (la Liste) = annonce − previewLeadDays. Dérivée de l'ouverture. */
export const previewFromOpen = (openIso: string | null, p: FormatPreset) =>
  openIso ? shiftIso(openIso, -(p.announceLeadDays + p.previewLeadDays) * DAY_MS) : "";

/**
 * Un drop programmé est visible « Avant-première » par la Liste à partir de sa
 * date de preview et jusqu'à l'annonce publique (après, il bascule « À venir »
 * pour tout le monde). Fenêtre : [previewFromOpen, announceFromOpen[.
 */
export function isInPreview(openIso: string | null, format: string | null, nowIso: string): boolean {
  const p = formatPreset(format);
  const prev = previewFromOpen(openIso, p);
  const ann = announceFromOpen(openIso, p);
  if (!prev || !ann) return false;
  const now = new Date(nowIso).getTime();
  return now >= new Date(prev).getTime() && now < new Date(ann).getTime();
}

/**
 * Prochains créneaux de reveal (jeudis à REVEAL_HOUR), en jours calendaires UTC
 * pour éviter les pièges DST. La valeur est au format <input datetime-local>
 * « YYYY-MM-DDTHH:00 » (mur d'horloge), cohérente avec le reste des dates admin.
 */
export function nextRevealSlots(fromIso: string, count: number): { value: string; label: string }[] {
  const base = new Date(fromIso);
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  while (d.getUTCDay() !== REVEAL_WEEKDAY) d.setUTCDate(d.getUTCDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  const slots: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const value = `${y}-${pad(m)}-${pad(day)}T${pad(REVEAL_HOUR)}:00`;
    const label =
      new Date(Date.UTC(y, m - 1, day, 12)).toLocaleDateString("fr-FR", {
        timeZone: "UTC",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }) + ` · ${pad(REVEAL_HOUR)}:00`;
    slots.push({ value, label });
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return slots;
}

export const STATUS_FR: Record<DropStatus, string> = {
  draft: "Brouillon",
  scheduled: "Programmé",
  open: "Ouvert",
  closed: "Révélation en cours",
  revealed: "Résultat",
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
  all_or_nothing: boolean;
  format: DropFormat;
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
