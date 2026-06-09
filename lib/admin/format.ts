export const eur = (cents: number | null | undefined) =>
  cents == null
    ? "—"
    : (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const dateTime = (iso: string | null | undefined) =>
  !iso ? "—" : new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export const dateShort = (iso: string | null | undefined) =>
  !iso ? "—" : new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "medium" });

/** Valeur attendue par un <input type="datetime-local"> (heure locale, sans tz). */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
