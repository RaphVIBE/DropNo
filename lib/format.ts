/**
 * Helpers de formatage. Rappel convention CLAUDE.md : les montants sont
 * TOUJOURS stockes en cents (number). On ne formate qu'a l'affichage.
 */

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Formate un montant en cents vers une chaine euros (ex: 300000 -> "3 000 €"). */
export function formatEuros(cents: number): string {
  return EUR.format(cents / 100);
}

/** Numero de drop formate facon Drop No. : 1 -> "001". */
export function formatDropNumber(n: number): string {
  return String(n).padStart(3, "0");
}

const PARIS = "Europe/Paris";

/** Date courte en heure de Paris : "7 juin". */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: PARIS,
  }).format(new Date(iso));
}

/** Moment de revelation lisible : "Jeudi 18h" (ou "Jeudi 18h30"). */
export function formatRevealMoment(iso: string): string {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    timeZone: PARIS,
  }).format(d);
  const hm = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: PARIS,
  }).format(d); // ex: "18:00"
  const [h, m] = hm.split(":");
  const hour = m === "00" ? `${h}h` : `${h}h${m}`;
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${hour}`;
}
