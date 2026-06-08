import { formatDropNumber, formatEuros } from "@/lib/format";

/**
 * Templates email (FR), style Drop No.
 *
 * Contraintes mail : pas de flex/grid (layout en <table>), styles inline,
 * couleurs en hex (oklch non supporté). On charge tout de même Fraunces + Inter
 * via <link> : les clients qui les supportent (Apple Mail, iOS) rendent la
 * vraie identité ; les autres retombent proprement sur Georgia / système.
 */

export type EmailContent = { subject: string; html: string; text: string };

/** Palette dérivée des design tokens (oklch -> hex email-safe). */
const C = {
  bg: "#f6f3ec", // off-white warm — oklch(0.975 0.006 80)
  panel: "#ffffff",
  ink: "#221d17", // deep brown-black — oklch(0.18 0.012 60)
  ink2: "#4a4339", // texte secondaire
  muted: "#8a8175", // labels / eyebrow
  rule: "#e6e0d3", // filets
  ruleSoft: "#efeae0",
  champagne: "#c4ac82", // accent — oklch(0.72 0.07 80)
  champagneInk: "#8c7a52", // accent texte (contraste suffisant)
};
const SERIF = "'Fraunces', Georgia, 'Times New Roman', serif";
const SANS =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** URL publique du site (CTA + assets). NEXT_PUBLIC_SITE_URL > NEXT_PUBLIC_APP_URL. */
function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://dropno.eu";
  return raw.replace(/\/$/, "");
}
/** Construit une URL absolue à partir d'un chemin relatif. */
function url(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
/** URL absolue d'un asset email hébergé (public/email/). */
function assetUrl(file: string): string {
  return url(`/email/${file}`);
}

/**
 * Échappe le texte injecté dans le HTML (titres de pièce saisis côté marque) :
 * un titre contenant &, <, > ou " ne doit jamais casser le rendu ni l'attribut.
 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Valide une URL d'image avant de l'injecter : seules des URL absolues http(s)
 * sont acceptées. Une URL relative, vide, ou un schéma douteux (javascript:,
 * data:) est rejetée -> l'email s'affiche proprement sans bandeau plutôt que
 * cassé. Retourne l'URL échappée (attribut) ou null.
 */
function safeImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return esc(u.toString());
  } catch {
    return null;
  }
}

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

// ---------------------------------------------------------------------------
// Briques de composition
// ---------------------------------------------------------------------------

/** Wordmark « Drop № » — serif italic, ordinal en champagne. */
function wordmark(): string {
  return `<span style="font-family:${SERIF};font-style:italic;font-weight:300;font-size:23px;letter-spacing:-0.01em;color:${C.ink};">Drop<sup style="font-size:0.62em;color:${C.champagneInk};vertical-align:super;margin-left:1px;">N&ordm;</sup></span>`;
}

function eyebrow(text: string): string {
  return `<p style="margin:0 0 14px;font-family:${SANS};font-size:11px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${C.muted};">${text}</p>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 18px;font-family:${SERIF};font-style:italic;font-weight:300;font-size:32px;line-height:1.08;letter-spacing:-0.02em;color:${C.ink};">${text}</h1>`;
}

function p(text: string, mt = 0): string {
  return `<p style="margin:${mt}px 0 0;font-family:${SANS};font-size:15px;line-height:1.62;color:${C.ink2};">${text}</p>`;
}

function statRow(label: string, value: string): string {
  return `<tr>
<td style="padding:13px 0;border-top:1px solid ${C.rule};font-family:${SANS};font-size:13px;color:${C.muted};">${label}</td>
<td style="padding:13px 0;border-top:1px solid ${C.rule};font-family:${SERIF};font-style:italic;font-weight:300;font-size:19px;color:${C.ink};text-align:right;">${value}</td>
</tr>`;
}

function stats(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">${rows}</table>`;
}

/** Bouton CTA « bulletproof » (table) — ink plein, label sans uppercase. */
function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 4px;">
<tr><td bgcolor="${C.ink}" style="background:${C.ink};">
<a href="${href}" style="display:inline-block;padding:14px 30px;font-family:${SANS};font-size:12px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:${C.bg};text-decoration:none;">${label}</a>
</td></tr></table>`;
}

/**
 * Bandeau « comment ça marche » — reprend la section mécanisme du site :
 * 3 étapes au trait (offre scellée / révélation / prix unique), numérotées,
 * avec repères d'angle. Assets PNG rasterisés (cf. scripts/email-assets).
 */
function mechanismStrip(): string {
  const step = (file: string, caption: string) =>
    `<td width="33%" align="center" valign="top" style="padding:0 4px;">
<img src="${assetUrl(file)}" width="150" alt="" style="display:block;margin:0 auto;width:100%;max-width:150px;height:auto;border:0;outline:none;"/>
<div style="margin-top:6px;font-family:${SANS};font-size:9px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:${C.muted};">${caption}</div>
</td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 2px;">
<tr>${step("step-01.png", "Offre scellée")}${step("step-02.png", "Révélation")}${step("step-03.png", "Prix unique")}</tr>
</table>`;
}

/** Filet pointillé champagne (séparateur façon site). */
function dashedRule(): string {
  return `<div style="border-top:1px dashed ${C.champagne};line-height:0;font-size:0;">&nbsp;</div>`;
}

/** Lien texte discret, sous le bouton. */
function textLink(label: string, href: string): string {
  return `<p style="margin:14px 0 0;font-family:${SANS};font-size:13px;color:${C.muted};"><a href="${href}" style="color:${C.champagneInk};text-decoration:none;border-bottom:1px solid ${C.rule};">${label}</a></p>`;
}

/**
 * Bandeau image de la pièce (optionnel) — sous l'en-tête, pleine largeur.
 *
 * Robuste face aux clients qui bloquent les images (Outlook/Gmail par défaut) :
 * la cellule porte un fond tinté et l'`alt` est stylé (police, couleur), si
 * bien qu'une image non chargée affiche le nom de la pièce sur une bande
 * brandée plutôt qu'une icône cassée. L'image est cliquable vers le drop.
 * `src` est supposé déjà validé/échappé par safeImageUrl().
 */
function heroImage(src: string, rawAlt: string, href?: string): string {
  const alt = esc(rawAlt);
  const img = `<img src="${src}" alt="${alt}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;outline:none;text-decoration:none;font-family:${SERIF};font-style:italic;font-size:16px;color:${C.muted};" />`;
  const content = href
    ? `<a href="${esc(href)}" style="text-decoration:none;">${img}</a>`
    : img;
  // Cadre à hauteur max + overflow:hidden : une photo très verticale est
  // recadrée par le haut au lieu d'étirer la carte. Les clients qui ignorent
  // overflow (Outlook desktop) affichent l'image entière -> dégradation OK.
  const framed = `<div style="max-height:360px;overflow:hidden;line-height:0;">${content}</div>`;
  return `<tr><td bgcolor="${C.bg}" style="background:${C.bg};font-size:0;line-height:0;border-bottom:1px solid ${C.ruleSoft};">${framed}</td></tr>`;
}

function layout(preheader: string, inner: string, hero?: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>Drop No.</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,300;0,9..144,400&family=Inter:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${C.panel};border:1px solid ${C.rule};">
<!-- filet d'accent champagne -->
<tr><td style="height:3px;background:${C.champagne};font-size:0;line-height:0;">&nbsp;</td></tr>
<!-- en-tête : wordmark + filigrane (cadran maison) -->
<tr><td style="padding:22px 40px;border-bottom:1px solid ${C.ruleSoft};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:middle;">${wordmark()}</td>
<td align="right" style="vertical-align:middle;width:54px;">
<img src="${assetUrl("filigrane.png")}" width="46" height="46" alt="" style="display:inline-block;width:46px;height:46px;border:0;outline:none;"/>
</td>
</tr></table>
</td></tr>
${hero ?? ""}
<!-- corps -->
<tr><td style="padding:40px 40px 36px;">${inner}</td></tr>
<!-- pied -->
<tr><td style="padding:24px 40px 30px;border-top:1px solid ${C.ruleSoft};font-family:${SANS};font-size:11px;line-height:1.7;color:${C.muted};">
<p style="margin:0 0 10px;">
<a href="${url("/account/dashboard")}" style="color:${C.muted};text-decoration:none;">Mon compte</a>
&nbsp;&middot;&nbsp;
<a href="${url("/account/notifications")}" style="color:${C.muted};text-decoration:none;">Préférences</a>
&nbsp;&middot;&nbsp;
<a href="${url("/aide")}" style="color:${C.muted};text-decoration:none;">Aide</a>
</p>
Drop No., maison de drops scellés pour montres premium.<br/>
Vous recevez cet email parce que vous participez à un drop. &copy; ${year} Drop No.
</td></tr>
</table>
</td></tr></table>
</body></html>`;
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
  dropId?: string;
  imageUrl?: string | null;
}): EmailContent {
  const num = formatDropNumber(d.dropNumber);
  const subject = `Offre scellée · Drop No. ${num}`;
  const rows = `${statRow("Pièce", esc(d.title))}
${statRow("Votre offre", formatEuros(d.amountCents))}
${statRow("Scellée le", fullTimestamp(d.submittedAt))}
${d.hash ? statRow("Empreinte", `${d.hash.slice(0, 16)}…`) : ""}`;
  const cta = d.dropId
    ? button("Voir mon offre", url(`/drop/${d.dropId}`)) +
      textLink(
        "Modifiable jusqu'à une heure avant la révélation",
        url(`/drop/${d.dropId}`)
      )
    : "";
  const inner = `${eyebrow(`Drop No. ${num}`)}
${h1("Votre offre est scellée.")}
${p("Votre offre reste invisible jusqu'à la révélation. Une pré-autorisation a été émise pour le montant exact, libérée si vous ne gagnez pas.")}
${stats(rows)}
${p("Vous pouvez modifier votre offre jusqu'à une heure avant la révélation. Vous recevrez le résultat par email.", 20)}
${cta}
<div style="margin:34px 0 0;">${dashedRule()}</div>
<div style="margin:22px 0 14px;">${eyebrow("Comment ça marche")}</div>
${mechanismStrip()}`;
  const text = `Offre scellée · Drop No. ${num}
Pièce : ${d.title}
Votre offre : ${formatEuros(d.amountCents)}
Scellée le : ${fullTimestamp(d.submittedAt)}${d.hash ? `\nEmpreinte : ${d.hash.slice(0, 16)}…` : ""}

Votre offre reste invisible jusqu'à la révélation. Modifiable jusqu'à T-1h.${
    d.dropId ? `\n\nVoir mon offre : ${url(`/drop/${d.dropId}`)}` : ""
  }`;
  const safeSrc = safeImageUrl(d.imageUrl);
  const hero = safeSrc
    ? heroImage(
        safeSrc,
        d.title,
        d.dropId ? url(`/drop/${d.dropId}`) : undefined
      )
    : undefined;
  return { subject, html: layout("Votre offre est scellée.", inner, hero), text };
}

// ---------------------------------------------------------------------------
// US-22 : résultat (gagné / non retenu)
// ---------------------------------------------------------------------------
export function dropResultEmail(d: {
  won: boolean;
  dropNumber: number;
  title: string;
  clearingPriceCents: number | null;
  dropId?: string;
}): EmailContent {
  const num = formatDropNumber(d.dropNumber);
  if (d.won) {
    const subject = `Vous avez gagné · Drop No. ${num}`;
    const inner = `${eyebrow(`Drop No. ${num}`)}
${h1("Vous avez gagné.")}
${p(
      `Félicitations. Vous remportez <strong style="color:${C.ink};font-weight:500;">${esc(d.title)}</strong>${
        d.clearingPriceCents
          ? ` au prix unitaire de <strong style="color:${C.ink};font-weight:500;">${formatEuros(d.clearingPriceCents)}</strong>`
          : ""
      }. Le paiement de votre pré-autorisation a été capturé.`
    )}
${p(
      "Notre concierge vous contacte pour organiser la livraison assurée. Vous disposez de 14 jours de rétractation à compter de la réception.",
      18
    )}
${button("Suivre ma livraison", url("/account/dashboard"))}`;
    const text = `Vous avez gagné · Drop No. ${num}\nVous remportez ${d.title}${d.clearingPriceCents ? ` au prix unitaire de ${formatEuros(d.clearingPriceCents)}` : ""}.\n\nSuivre ma livraison : ${url("/account/dashboard")}`;
    return { subject, html: layout("Vous avez gagné ce drop.", inner), text };
  }
  const subject = `Résultat · Drop No. ${num}`;
  const inner = `${eyebrow(`Drop No. ${num}`)}
${h1("Vous n'avez pas gagné ce drop.")}
${p(
    `Votre offre n'a pas atteint le prix de clôture${
      d.clearingPriceCents ? ` (${formatEuros(d.clearingPriceCents)})` : ""
    }. Votre pré-autorisation a été intégralement libérée, aucun montant n'a été prélevé.`
  )}
${p("Le prochain drop vous attend dans le calendrier.", 18)}
${button("Voir le calendrier", url("/"))}`;
  const text = `Résultat · Drop No. ${num}\nVotre offre n'a pas été retenue. Pré-autorisation libérée, aucun prélèvement.\n\nVoir le calendrier : ${url("/")}`;
  return { subject, html: layout("Résultat du drop.", inner), text };
}

// ---------------------------------------------------------------------------
// US-22 : rappels événementiels (ouverture, T-24h, T-1h)
// ---------------------------------------------------------------------------
export function dropReminderEmail(d: {
  kind: "open" | "h24" | "h1";
  dropNumber: number;
  title: string;
  dropId?: string;
}): EmailContent {
  const num = formatDropNumber(d.dropNumber);
  const copy = {
    open: {
      subject: `Drop No. ${num} est ouvert`,
      title: "Le drop est ouvert.",
      body: "Vous avez cinq jours pour sceller votre offre. Une seule offre, cachée jusqu'à la révélation, modifiable à tout moment avant la dernière heure.",
      cta: "Sceller mon offre",
    },
    h24: {
      subject: `Plus que 24h · Drop No. ${num}`,
      title: "Plus que 24 heures.",
      body: "La révélation approche. Votre offre est-elle prête ? Vous pouvez encore la modifier.",
      cta: "Vérifier mon offre",
    },
    h1: {
      subject: `Dernière heure · Drop No. ${num}`,
      title: "Dernière heure.",
      body: "Les offres se verrouillent dans une heure. C'est votre dernière chance de modifier la vôtre.",
      cta: "Modifier mon offre",
    },
  }[d.kind];

  const inner = `${eyebrow(`Drop No. ${num} · ${esc(d.title)}`)}
${h1(copy.title)}
${p(copy.body)}
${d.dropId ? button(copy.cta, url(`/drop/${d.dropId}`)) : ""}`;
  const text = `${copy.subject}\n${copy.body}${d.dropId ? `\n\n${copy.cta} : ${url(`/drop/${d.dropId}`)}` : ""}`;
  return { subject: copy.subject, html: layout(copy.title, inner), text };
}

// ---------------------------------------------------------------------------
// Alertes "montre" (visiteur sans compte, double opt-in)
// ---------------------------------------------------------------------------
export function alertConfirmEmail(d: {
  dropNumber: number;
  title: string;
  confirmUrl: string;
}): EmailContent {
  const num = formatDropNumber(d.dropNumber);
  const subject = `Confirmez votre alerte · Drop No. ${num}`;
  const inner = `${eyebrow(`Drop No. ${num} · ${esc(d.title)}`)}
${h1("Confirmez votre alerte.")}
${p(`Vous souhaitez suivre <strong style="color:${C.ink};">${esc(d.title)}</strong>. Confirmez votre adresse pour activer l'alerte, c'est la seule étape.`)}
${button("Confirmer mon alerte", d.confirmUrl)}
${p("Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : aucune alerte ne sera créée.", 22)}`;
  const text = `${subject}\n\nConfirmez votre alerte : ${d.confirmUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;
  return { subject, html: layout("Confirmez votre alerte Drop No.", inner), text };
}

export function alertNoticeEmail(d: {
  kind: "open" | "lock";
  dropNumber: number;
  title: string;
  dropId: string;
  unsubscribeUrl: string;
}): EmailContent {
  const num = formatDropNumber(d.dropNumber);
  const copy = {
    open: {
      subject: `C'est ouvert · Drop No. ${num}`,
      title: "Le drop est ouvert.",
      body: "La fenêtre d'offres est ouverte. Scellez votre prix, caché jusqu'à la révélation et modifiable jusqu'à la dernière heure.",
      cta: "Voir le drop",
    },
    lock: {
      subject: `Dernière heure · Drop No. ${num}`,
      title: "Dernière heure.",
      body: "Les offres se verrouillent dans une heure. C'est le dernier moment pour faire ou ajuster votre offre.",
      cta: "Faire mon offre",
    },
  }[d.kind];
  const inner = `${eyebrow(`Drop No. ${num} · ${esc(d.title)}`)}
${h1(copy.title)}
${p(copy.body)}
${button(copy.cta, url(`/drop/${d.dropId}`))}
${textLink("Ne plus recevoir d'alerte pour ce drop", d.unsubscribeUrl)}`;
  const text = `${copy.subject}\n${copy.body}\n\n${copy.cta} : ${url(`/drop/${d.dropId}`)}\nSe désinscrire : ${d.unsubscribeUrl}`;
  return { subject: copy.subject, html: layout(copy.title, inner), text };
}
