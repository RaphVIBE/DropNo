import { formatDropNumber, formatEuros } from "@/lib/format";

/**
 * Templates email (FR), style Drop No. Les clients mail ne chargent pas de
 * polices custom ni oklch -> on retombe sur des serif/sans système et des hex.
 */

export type EmailContent = { subject: string; html: string; text: string };

const C = {
  bg: "#faf8f3",
  panel: "#ffffff",
  ink: "#221d17",
  ink2: "#4a4339",
  muted: "#8a8175",
  rule: "#e2dccf",
  champagne: "#8c7a52",
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Helvetica, Arial, sans-serif";

function fullTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

function layout(preheader: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="color-scheme" content="light"/></head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${C.panel};border:1px solid ${C.rule};">
<tr><td style="padding:28px 36px;border-bottom:1px solid ${C.rule};">
<span style="font-family:${SERIF};font-style:italic;font-size:22px;color:${C.ink};">Drop <sup style="font-size:13px;">N&ordm;</sup></span>
</td></tr>
<tr><td style="padding:36px;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.ink2};">
${inner}
</td></tr>
<tr><td style="padding:24px 36px;border-top:1px solid ${C.rule};font-family:${SANS};font-size:11px;line-height:1.6;color:${C.muted};">
Drop No., maison de drops scellés pour montres premium.<br/>
Vous recevez cet email car vous participez à un drop. Préférences de notification dans votre compte.
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${SERIF};font-style:italic;font-weight:normal;font-size:30px;line-height:1.15;color:${C.ink};">${text}</h1>`;
}
function eyebrow(text: string): string {
  return `<p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${C.muted};">${text}</p>`;
}
function statRow(label: string, value: string): string {
  return `<tr>
<td style="padding:12px 0;border-top:1px solid ${C.rule};font-size:13px;color:${C.muted};">${label}</td>
<td style="padding:12px 0;border-top:1px solid ${C.rule};font-family:${SERIF};font-style:italic;font-size:18px;color:${C.ink};text-align:right;">${value}</td>
</tr>`;
}

// ---------------------------------------------------------------------------
// US-05 : confirmation d'offre scellée (hash + horodatage)
// ---------------------------------------------------------------------------
export function bidConfirmationEmail(d: {
  dropNumber: number;
  title: string;
  amountCents: number;
  submittedAt: string;
  hash: string | null;
}): EmailContent {
  const num = formatDropNumber(d.dropNumber);
  const subject = `Offre scellée · Drop No. ${num}`;
  const stats = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
${statRow("Pièce", d.title)}
${statRow("Votre offre", formatEuros(d.amountCents))}
${statRow("Scellée le", fullTimestamp(d.submittedAt))}
${d.hash ? statRow("Empreinte", `${d.hash.slice(0, 16)}…`) : ""}
</table>`;
  const inner = `${eyebrow(`Drop No. ${num}`)}
${h1("Votre offre est scellée.")}
<p style="margin:0;">Votre offre reste invisible jusqu'à la révélation. Une pré-autorisation a été émise pour le montant exact, libérée si vous ne gagnez pas.</p>
${stats}
<p style="margin:0;">Vous pouvez modifier votre offre jusqu'à une heure avant la révélation. Vous recevrez le résultat par email.</p>`;
  const text = `Offre scellée · Drop No. ${num}
Pièce : ${d.title}
Votre offre : ${formatEuros(d.amountCents)}
Scellée le : ${fullTimestamp(d.submittedAt)}${d.hash ? `\nEmpreinte : ${d.hash.slice(0, 16)}…` : ""}

Votre offre reste invisible jusqu'à la révélation. Modifiable jusqu'à T-1h.`;
  return { subject, html: layout("Votre offre est scellée.", inner), text };
}

// ---------------------------------------------------------------------------
// US-22 : résultat (gagné / non retenu)
// ---------------------------------------------------------------------------
export function dropResultEmail(d: {
  won: boolean;
  dropNumber: number;
  title: string;
  clearingPriceCents: number | null;
}): EmailContent {
  const num = formatDropNumber(d.dropNumber);
  if (d.won) {
    const subject = `Vous avez gagné · Drop No. ${num}`;
    const inner = `${eyebrow(`Drop No. ${num}`)}
${h1("Vous avez gagné.")}
<p style="margin:0;">Félicitations. Vous remportez <strong style="color:${C.ink};">${d.title}</strong>${
      d.clearingPriceCents
        ? ` au prix unitaire de <strong style="color:${C.ink};">${formatEuros(d.clearingPriceCents)}</strong>`
        : ""
    }. Le paiement de votre pré-autorisation a été capturé.</p>
<p style="margin:16px 0 0;">Notre concierge vous contacte pour organiser la livraison assurée. Vous disposez de 14 jours de rétractation à compter de la réception.</p>`;
    const text = `Vous avez gagné · Drop No. ${num}\nVous remportez ${d.title}${d.clearingPriceCents ? ` au prix unitaire de ${formatEuros(d.clearingPriceCents)}` : ""}.`;
    return { subject, html: layout("Vous avez gagné ce drop.", inner), text };
  }
  const subject = `Résultat · Drop No. ${num}`;
  const inner = `${eyebrow(`Drop No. ${num}`)}
${h1("Vous n'avez pas gagné ce drop.")}
<p style="margin:0;">Votre offre n'a pas atteint le prix de clôture${
    d.clearingPriceCents ? ` (${formatEuros(d.clearingPriceCents)})` : ""
  }. Votre pré-autorisation a été intégralement libérée, aucun montant n'a été prélevé.</p>
<p style="margin:16px 0 0;">Le prochain drop vous attend dans le calendrier.</p>`;
  const text = `Résultat · Drop No. ${num}\nVotre offre n'a pas été retenue. Pré-autorisation libérée, aucun prélèvement.`;
  return { subject, html: layout("Résultat du drop.", inner), text };
}

// ---------------------------------------------------------------------------
// US-22 : rappels événementiels (ouverture, T-24h, T-1h)
// ---------------------------------------------------------------------------
export function dropReminderEmail(d: {
  kind: "open" | "h24" | "h1";
  dropNumber: number;
  title: string;
}): EmailContent {
  const num = formatDropNumber(d.dropNumber);
  const copy = {
    open: {
      subject: `Drop No. ${num} est ouvert`,
      title: "Le drop est ouvert.",
      body: "Vous avez cinq jours pour sceller votre offre. Une seule offre, cachée jusqu'à la révélation, modifiable à tout moment avant la dernière heure.",
    },
    h24: {
      subject: `Plus que 24h · Drop No. ${num}`,
      title: "Plus que 24 heures.",
      body: "La révélation approche. Votre offre est-elle prête ? Vous pouvez encore la modifier.",
    },
    h1: {
      subject: `Dernière heure · Drop No. ${num}`,
      title: "Dernière heure.",
      body: "Les offres se verrouillent dans une heure. C'est votre dernière chance de modifier la vôtre.",
    },
  }[d.kind];

  const inner = `${eyebrow(`Drop No. ${num} · ${d.title}`)}
${h1(copy.title)}
<p style="margin:0;">${copy.body}</p>`;
  const text = `${copy.subject}\n${copy.body}`;
  return { subject: copy.subject, html: layout(copy.title, inner), text };
}
