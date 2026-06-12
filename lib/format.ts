/**
 * Helpers de formatage. Rappel convention CLAUDE.md : les montants sont
 * TOUJOURS stockes en cents (number). On ne formate qu'a l'affichage.
 *
 * Chaque helper accepte une locale (defaut "fr") pour rester retro-compatible :
 * les appels existants sans locale gardent le rendu FR.
 */
import type { Locale } from "@/i18n/routing";

const BCP47: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };
const PARIS = "Europe/Paris";

/** Formate un montant en cents vers une chaine euros (ex: 300000 -> "3 000 €"). */
export function formatEuros(cents: number, locale: Locale = "fr"): string {
  return new Intl.NumberFormat(BCP47[locale], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Numero de drop formate facon Drop No. : 1 -> "001". */
export function formatDropNumber(n: number): string {
  return String(n).padStart(3, "0");
}

/** Date courte en heure de Paris : "7 juin" / "7 June". */
export function formatShortDate(iso: string, locale: Locale = "fr"): string {
  return new Intl.DateTimeFormat(BCP47[locale], {
    day: "numeric",
    month: "long",
    timeZone: PARIS,
  }).format(new Date(iso));
}

/** Moment de revelation lisible : "Jeudi 18h" (FR) / "Thursday, 18:00" (EN). */
export function formatRevealMoment(iso: string, locale: Locale = "fr"): string {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat(BCP47[locale], {
    weekday: "long",
    timeZone: PARIS,
  }).format(d);
  const capWeekday = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`;

  if (locale === "en") {
    const hm = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: PARIS,
    }).format(d); // ex: "18:00"
    return `${capWeekday}, ${hm}`;
  }

  const hm = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: PARIS,
  }).format(d); // ex: "18:00"
  const [h, m] = hm.split(":");
  const hour = m === "00" ? `${h}h` : `${h}h${m}`;
  return `${capWeekday} ${hour}`;
}
