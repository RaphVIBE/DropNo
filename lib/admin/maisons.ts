import type { Tone } from "./ui";

// Règles de contenu maison — miroir exact des contraintes CHECK DB (0014).
export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const SLUG_MAX = 50;
export const DESC_MAX = 280;

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const LOGO_RE = /^https:\/\/\S+\.(png|jpe?g|webp|svg)$/i;
export const SITE_RE = /^https:\/\/[^\s/]+\.[^\s]+/i;
export const COUNTRY_RE = /^[A-Z]{2}$/;

export const LOGO_HINT = "https://… terminant par .png, .jpg, .jpeg, .webp ou .svg";
export const SITE_HINT = "https://… (lien vers le site de la maison)";

export type BrandStatus = "pending" | "active" | "paused" | "terminated";
export const STATUS_FR: Record<BrandStatus, string> = {
  pending: "En attente", active: "Active", paused: "En pause", terminated: "Résiliée",
};
export const STATUS_TONE: Record<BrandStatus, Tone> = {
  pending: "amber", active: "green", paused: "zinc", terminated: "red",
};

export type MaisonInput = {
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  country_code: string | null;
  status: BrandStatus;
  kbis_verified: boolean;
  stripe_account_id: string | null;
};

export function slugify(name: string): string {
  return name
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX);
}

export function validateMaison(d: MaisonInput): string[] {
  const e: string[] = [];
  if (d.name.length < NAME_MIN || d.name.length > NAME_MAX)
    e.push(`Le nom doit faire entre ${NAME_MIN} et ${NAME_MAX} caractères.`);
  if (!SLUG_RE.test(d.slug) || d.slug.length > SLUG_MAX)
    e.push("Le slug doit être en minuscules, chiffres et tirets (ex. maison-levrier).");
  if (d.description && d.description.length > DESC_MAX)
    e.push(`La description ne peut dépasser ${DESC_MAX} caractères.`);
  if (d.logo_url && !LOGO_RE.test(d.logo_url)) e.push(`Logo invalide : ${LOGO_HINT}.`);
  if (d.website_url && !SITE_RE.test(d.website_url)) e.push("Le site doit être une URL https valide.");
  if (d.country_code && !COUNTRY_RE.test(d.country_code)) e.push("Le code pays doit être 2 lettres majuscules (ex. FR).");
  return e;
}
