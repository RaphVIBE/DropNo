import { formatDropNumber, formatEuros } from "@/lib/format";

/**
 * Templates email (FR / EN), style Drop No.
 *
 * Contraintes mail : pas de flex/grid (layout en <table>), styles inline,
 * couleurs en hex (oklch non supporté). On charge tout de même Fraunces + Inter
 * via <link> : les clients qui les supportent (Apple Mail, iOS) rendent la
 * vraie identité ; les autres retombent proprement sur Georgia / système.
 *
 * Localisation : chaque template prend une `locale` ("fr" | "en", défaut "fr").
 * Les emails partent hors contexte de requête (crons, webhooks) : on n'utilise
 * donc PAS next-intl mais un dictionnaire local EMAIL_COPY. La locale du
 * destinataire vient de profiles.locale (comptes) ou drop_alerts.locale (alertes).
 */

export type EmailContent = { subject: string; html: string; text: string };
export type EmailLocale = "fr" | "en";

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
/**
 * Construit une URL absolue. Pour l'EN, on préfixe le chemin par /en (les routes
 * vitrine sont localisées ; les assets /email/* restent à la racine).
 */
function url(path: string, locale: EmailLocale = "fr"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const prefixed = locale === "en" && !p.startsWith("/email/") ? `/en${p}` : p;
  return `${siteUrl()}${prefixed}`;
}
/** URL absolue d'un asset email hébergé (public/email/), jamais préfixée. */
function assetUrl(file: string): string {
  return `${siteUrl()}/email/${file}`;
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

function fullTimestamp(iso: string, locale: EmailLocale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

// ---------------------------------------------------------------------------
// Dictionnaire de copie FR / EN
// ---------------------------------------------------------------------------

const EMAIL_COPY = {
  fr: {
    footer: {
      account: "Mon compte",
      prefs: "Préférences",
      help: "Aide",
      house: "Drop No., maison de drops scellés pour montres premium.",
      why: "Vous recevez cet email parce que vous participez à un drop.",
    },
    mechanism: {
      sealed: "Offre scellée",
      reveal: "Révélation",
      clearing: "Prix unique",
      howItWorks: "Comment ça marche",
    },
    bid: {
      subject: (num: string) => `Offre scellée · Drop No. ${num}`,
      preheader: "Votre offre est scellée.",
      h1: "Votre offre est scellée.",
      intro:
        "Votre offre reste invisible jusqu'à la révélation. Une pré-autorisation a été émise pour le montant exact, libérée si vous ne gagnez pas.",
      labelPiece: "Pièce",
      labelBid: "Votre offre",
      labelSealedOn: "Scellée le",
      labelFingerprint: "Empreinte",
      editNote:
        "Vous pouvez modifier votre offre jusqu'à une heure avant la révélation. Vous recevrez le résultat par email.",
      cta: "Voir mon offre",
      editLink: "Modifiable jusqu'à une heure avant la révélation",
      hiddenNote:
        "Votre offre reste invisible jusqu'à la révélation. Modifiable jusqu'à T-1h.",
    },
    result: {
      wonSubject: (num: string) => `Vous avez gagné · Drop No. ${num}`,
      wonPreheader: "Vous avez gagné ce drop.",
      wonH1: "Vous avez gagné.",
      wonBody: (title: string, priceClause: string) =>
        `Félicitations. Vous remportez <strong style="color:${C.ink};font-weight:500;">${esc(title)}</strong>${priceClause}. Le paiement de votre pré-autorisation a été capturé.`,
      wonPriceClause: (price: string) =>
        ` au prix unitaire de <strong style="color:${C.ink};font-weight:500;">${price}</strong>`,
      wonBodyText: (title: string, priceClause: string) =>
        `Vous remportez ${title}${priceClause}.`,
      wonPriceClauseText: (price: string) => ` au prix unitaire de ${price}`,
      wonDelivery:
        "Notre concierge vous contacte pour organiser la livraison assurée. Vous disposez de 14 jours de rétractation à compter de la réception.",
      wonCta: "Suivre ma livraison",
      lostSubject: (num: string) => `Résultat · Drop No. ${num}`,
      lostPreheader: "Résultat du drop.",
      lostH1: "Vous n'avez pas gagné ce drop.",
      lostBody: (priceClause: string) =>
        `Votre offre n'a pas atteint le prix de clôture${priceClause}. Votre pré-autorisation a été intégralement libérée, aucun montant n'a été prélevé.`,
      lostPriceClause: (price: string) => ` (${price})`,
      lostBodyText:
        "Votre offre n'a pas été retenue. Pré-autorisation libérée, aucun prélèvement.",
      lostNext: "Le prochain drop vous attend dans le calendrier.",
      lostCta: "Voir le calendrier",
    },
    serial: {
      subject: (num: string) => `Une dernière chose · Drop No. ${num}`,
      preheader: "Votre offre était la plus haute de ce drop.",
      h1: "Une dernière chose.",
      intro: (serial: string) =>
        `Votre offre était la plus haute de ce drop. À ce titre, la pièce maîtresse, le numéro de série <strong style="color:${C.ink};font-weight:500;">${serial}</strong>, vous est réservée.`,
      introText: (serial: string) =>
        `Votre offre était la plus haute de ce drop. À ce titre, la pièce maîtresse, le numéro de série ${serial}, vous est réservée.`,
      body: "Vous pouvez la faire vôtre pour le supplément indiqué ci-dessous. Cette offre est strictement personnelle et expire dans 24 heures. Personne d'autre ne la recevra.",
      bodyText:
        "Cette offre est strictement personnelle et expire dans 24 heures.",
      labelPiece: "Pièce",
      labelSerial: "Numéro de série",
      labelSupplement: "Supplément",
      labelExpires: "Expire le",
      cta: "Réserver le № 001",
      keepLink: "Ou conserver mon numéro attribué",
    },
    reminder: {
      open: {
        subject: (num: string) => `Drop No. ${num} est ouvert`,
        title: "Le drop est ouvert.",
        body: "Vous avez cinq jours pour sceller votre offre. Une seule offre, cachée jusqu'à la révélation, modifiable à tout moment avant la dernière heure.",
        cta: "Sceller mon offre",
      },
      h72: {
        subject: (num: string) => `Plus que 3 jours · Drop No. ${num}`,
        title: "Plus que trois jours.",
        body: "La révélation approche. Si vous n'avez pas encore scellé votre offre, c'est le moment de la préparer. Vous pourrez la modifier jusqu'à la dernière heure.",
        cta: "Préparer mon offre",
      },
      h24: {
        subject: (num: string) => `Plus que 24h · Drop No. ${num}`,
        title: "Plus que 24 heures.",
        body: "La révélation approche. Votre offre est-elle prête ? Vous pouvez encore la modifier.",
        cta: "Vérifier mon offre",
      },
      h1: {
        subject: (num: string) => `Dernière heure · Drop No. ${num}`,
        title: "Dernière heure.",
        body: "Les offres se verrouillent dans une heure. C'est votre dernière chance de modifier la vôtre.",
        cta: "Modifier mon offre",
      },
    },
    alert: {
      confirmSubject: (num: string) => `Confirmez votre alerte · Drop No. ${num}`,
      confirmPreheader: "Confirmez votre alerte Drop No.",
      confirmH1: "Confirmez votre alerte.",
      confirmBody: (title: string) =>
        `Vous souhaitez suivre <strong style="color:${C.ink};">${esc(title)}</strong>. Confirmez votre adresse pour activer l'alerte, c'est la seule étape.`,
      confirmCta: "Confirmer mon alerte",
      confirmDisclaimer:
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : aucune alerte ne sera créée.",
      open: {
        subject: (num: string) => `C'est ouvert · Drop No. ${num}`,
        title: "Le drop est ouvert.",
        body: "La fenêtre d'offres est ouverte. Scellez votre prix, caché jusqu'à la révélation et modifiable jusqu'à la dernière heure.",
        cta: "Voir le drop",
      },
      lock: {
        subject: (num: string) => `Dernière heure · Drop No. ${num}`,
        title: "Dernière heure.",
        body: "Les offres se verrouillent dans une heure. C'est le dernier moment pour faire ou ajuster votre offre.",
        cta: "Faire mon offre",
      },
      unsubscribe: "Ne plus recevoir d'alerte pour ce drop",
    },
  },
  en: {
    footer: {
      account: "My account",
      prefs: "Preferences",
      help: "Help",
      house: "Drop No., a house of sealed drops for premium watches.",
      why: "You're receiving this email because you take part in a drop.",
    },
    mechanism: {
      sealed: "Sealed bid",
      reveal: "Reveal",
      clearing: "Single price",
      howItWorks: "How it works",
    },
    bid: {
      subject: (num: string) => `Sealed bid · Drop No. ${num}`,
      preheader: "Your bid is sealed.",
      h1: "Your bid is sealed.",
      intro:
        "Your bid stays hidden until the reveal. A pre-authorisation has been placed for the exact amount, released if you don't win.",
      labelPiece: "Piece",
      labelBid: "Your bid",
      labelSealedOn: "Sealed on",
      labelFingerprint: "Fingerprint",
      editNote:
        "You can change your bid until one hour before the reveal. You'll receive the result by email.",
      cta: "View my bid",
      editLink: "Editable until one hour before the reveal",
      hiddenNote:
        "Your bid stays hidden until the reveal. Editable until T-1h.",
    },
    result: {
      wonSubject: (num: string) => `You won · Drop No. ${num}`,
      wonPreheader: "You won this drop.",
      wonH1: "You won.",
      wonBody: (title: string, priceClause: string) =>
        `Congratulations. You win <strong style="color:${C.ink};font-weight:500;">${esc(title)}</strong>${priceClause}. The payment on your pre-authorisation has been captured.`,
      wonPriceClause: (price: string) =>
        ` at the unit price of <strong style="color:${C.ink};font-weight:500;">${price}</strong>`,
      wonBodyText: (title: string, priceClause: string) =>
        `You win ${title}${priceClause}.`,
      wonPriceClauseText: (price: string) => ` at the unit price of ${price}`,
      wonDelivery:
        "Our concierge will contact you to arrange insured delivery. You have 14 days to withdraw from receipt.",
      wonCta: "Track my delivery",
      lostSubject: (num: string) => `Result · Drop No. ${num}`,
      lostPreheader: "Drop result.",
      lostH1: "You didn't win this drop.",
      lostBody: (priceClause: string) =>
        `Your bid didn't reach the clearing price${priceClause}. Your pre-authorisation has been released in full, nothing was charged.`,
      lostPriceClause: (price: string) => ` (${price})`,
      lostBodyText:
        "Your bid wasn't retained. Pre-authorisation released, nothing charged.",
      lostNext: "The next drop is waiting for you on the calendar.",
      lostCta: "View the calendar",
    },
    serial: {
      subject: (num: string) => `One last thing · Drop No. ${num}`,
      preheader: "Yours was the highest bid of this drop.",
      h1: "One last thing.",
      intro: (serial: string) =>
        `Yours was the highest bid of this drop. As such, the flagship piece, serial number <strong style="color:${C.ink};font-weight:500;">${serial}</strong>, is reserved for you.`,
      introText: (serial: string) =>
        `Yours was the highest bid of this drop. As such, the flagship piece, serial number ${serial}, is reserved for you.`,
      body: "You can make it yours for the supplement shown below. This offer is strictly personal and expires in 24 hours. No one else will receive it.",
      bodyText: "This offer is strictly personal and expires in 24 hours.",
      labelPiece: "Piece",
      labelSerial: "Serial number",
      labelSupplement: "Supplement",
      labelExpires: "Expires on",
      cta: "Reserve № 001",
      keepLink: "Or keep my assigned number",
    },
    reminder: {
      open: {
        subject: (num: string) => `Drop No. ${num} is open`,
        title: "The drop is open.",
        body: "You have five days to seal your bid. A single bid, hidden until the reveal, editable at any time before the final hour.",
        cta: "Seal my bid",
      },
      h72: {
        subject: (num: string) => `Three days left · Drop No. ${num}`,
        title: "Three days left.",
        body: "The reveal is approaching. If you haven't sealed your bid yet, now is the time to prepare it. You can change it until the final hour.",
        cta: "Prepare my bid",
      },
      h24: {
        subject: (num: string) => `24 hours left · Drop No. ${num}`,
        title: "24 hours left.",
        body: "The reveal is approaching. Is your bid ready? You can still change it.",
        cta: "Check my bid",
      },
      h1: {
        subject: (num: string) => `Final hour · Drop No. ${num}`,
        title: "Final hour.",
        body: "Bids lock in one hour. This is your last chance to change yours.",
        cta: "Edit my bid",
      },
    },
    alert: {
      confirmSubject: (num: string) => `Confirm your alert · Drop No. ${num}`,
      confirmPreheader: "Confirm your Drop No. alert.",
      confirmH1: "Confirm your alert.",
      confirmBody: (title: string) =>
        `You'd like to follow <strong style="color:${C.ink};">${esc(title)}</strong>. Confirm your address to activate the alert — that's the only step.`,
      confirmCta: "Confirm my alert",
      confirmDisclaimer:
        "If you didn't request this, ignore this email: no alert will be created.",
      open: {
        subject: (num: string) => `It's open · Drop No. ${num}`,
        title: "The drop is open.",
        body: "The bidding window is open. Seal your price, hidden until the reveal and editable until the final hour.",
        cta: "View the drop",
      },
      lock: {
        subject: (num: string) => `Final hour · Drop No. ${num}`,
        title: "Final hour.",
        body: "Bids lock in one hour. This is the last moment to place or adjust your bid.",
        cta: "Place my bid",
      },
      unsubscribe: "Stop receiving alerts for this drop",
    },
  },
} as const;

function copy(locale: EmailLocale) {
  return EMAIL_COPY[locale] ?? EMAIL_COPY.fr;
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
function mechanismStrip(locale: EmailLocale): string {
  const m = copy(locale).mechanism;
  const step = (file: string, caption: string) =>
    `<td width="33%" align="center" valign="top" style="padding:0 4px;">
<img src="${assetUrl(file)}" width="150" alt="" style="display:block;margin:0 auto;width:100%;max-width:150px;height:auto;border:0;outline:none;"/>
<div style="margin-top:6px;font-family:${SANS};font-size:9px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:${C.muted};">${caption}</div>
</td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 2px;">
<tr>${step("step-01.png", m.sealed)}${step("step-02.png", m.reveal)}${step("step-03.png", m.clearing)}</tr>
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
 * `src` est supposé déjà validé/échappé par safeImageUrl().
 */
function heroImage(src: string, rawAlt: string, href?: string): string {
  const alt = esc(rawAlt);
  const img = `<img src="${src}" alt="${alt}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;outline:none;text-decoration:none;font-family:${SERIF};font-style:italic;font-size:16px;color:${C.muted};" />`;
  const content = href
    ? `<a href="${esc(href)}" style="text-decoration:none;">${img}</a>`
    : img;
  const framed = `<div style="max-height:360px;overflow:hidden;line-height:0;">${content}</div>`;
  return `<tr><td bgcolor="${C.bg}" style="background:${C.bg};font-size:0;line-height:0;border-bottom:1px solid ${C.ruleSoft};">${framed}</td></tr>`;
}

function layout(
  locale: EmailLocale,
  preheader: string,
  inner: string,
  hero?: string
): string {
  const year = new Date().getFullYear();
  const f = copy(locale).footer;
  return `<!DOCTYPE html>
<html lang="${locale}"><head>
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
<a href="${url("/account/dashboard", locale)}" style="color:${C.muted};text-decoration:none;">${f.account}</a>
&nbsp;&middot;&nbsp;
<a href="${url("/account/notifications", locale)}" style="color:${C.muted};text-decoration:none;">${f.prefs}</a>
&nbsp;&middot;&nbsp;
<a href="${url("/aide", locale)}" style="color:${C.muted};text-decoration:none;">${f.help}</a>
</p>
${f.house}<br/>
${f.why} &copy; ${year} Drop No.
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ---------------------------------------------------------------------------
// US-05 : confirmation d'offre scellée (hash + horodatage)
// ---------------------------------------------------------------------------
export function bidConfirmationEmail(
  d: {
    dropNumber: number;
    title: string;
    amountCents: number;
    submittedAt: string;
    hash: string | null;
    dropId?: string;
    imageUrl?: string | null;
  },
  locale: EmailLocale = "fr"
): EmailContent {
  const t = copy(locale).bid;
  const num = formatDropNumber(d.dropNumber);
  const subject = t.subject(num);
  const rows = `${statRow(t.labelPiece, esc(d.title))}
${statRow(t.labelBid, formatEuros(d.amountCents, locale))}
${statRow(t.labelSealedOn, fullTimestamp(d.submittedAt, locale))}
${d.hash ? statRow(t.labelFingerprint, `${d.hash.slice(0, 16)}…`) : ""}`;
  const cta = d.dropId
    ? button(t.cta, url(`/drop/${d.dropId}`, locale)) +
      textLink(t.editLink, url(`/drop/${d.dropId}`, locale))
    : "";
  const inner = `${eyebrow(`Drop No. ${num}`)}
${h1(t.h1)}
${p(t.intro)}
${stats(rows)}
${p(t.editNote, 20)}
${cta}
<div style="margin:34px 0 0;">${dashedRule()}</div>
<div style="margin:22px 0 14px;">${eyebrow(copy(locale).mechanism.howItWorks)}</div>
${mechanismStrip(locale)}`;
  const text = `${subject}
${t.labelPiece} : ${d.title}
${t.labelBid} : ${formatEuros(d.amountCents, locale)}
${t.labelSealedOn} : ${fullTimestamp(d.submittedAt, locale)}${d.hash ? `\n${t.labelFingerprint} : ${d.hash.slice(0, 16)}…` : ""}

${t.hiddenNote}${d.dropId ? `\n\n${t.cta} : ${url(`/drop/${d.dropId}`, locale)}` : ""}`;
  const safeSrc = safeImageUrl(d.imageUrl);
  const hero = safeSrc
    ? heroImage(safeSrc, d.title, d.dropId ? url(`/drop/${d.dropId}`, locale) : undefined)
    : undefined;
  return { subject, html: layout(locale, t.preheader, inner, hero), text };
}

// ---------------------------------------------------------------------------
// US-22 : résultat (gagné / non retenu)
// ---------------------------------------------------------------------------
export function dropResultEmail(
  d: {
    won: boolean;
    dropNumber: number;
    title: string;
    clearingPriceCents: number | null;
    dropId?: string;
  },
  locale: EmailLocale = "fr"
): EmailContent {
  const t = copy(locale).result;
  const num = formatDropNumber(d.dropNumber);
  if (d.won) {
    const price = d.clearingPriceCents
      ? formatEuros(d.clearingPriceCents, locale)
      : null;
    const subject = t.wonSubject(num);
    const inner = `${eyebrow(`Drop No. ${num}`)}
${h1(t.wonH1)}
${p(t.wonBody(d.title, price ? t.wonPriceClause(price) : ""))}
${p(t.wonDelivery, 18)}
${button(t.wonCta, url("/account/dashboard", locale))}`;
    const text = `${subject}\n${t.wonBodyText(d.title, price ? t.wonPriceClauseText(price) : "")}\n\n${t.wonCta} : ${url("/account/dashboard", locale)}`;
    return { subject, html: layout(locale, t.wonPreheader, inner), text };
  }
  const price = d.clearingPriceCents
    ? formatEuros(d.clearingPriceCents, locale)
    : null;
  const subject = t.lostSubject(num);
  const inner = `${eyebrow(`Drop No. ${num}`)}
${h1(t.lostH1)}
${p(t.lostBody(price ? t.lostPriceClause(price) : ""))}
${p(t.lostNext, 18)}
${button(t.lostCta, url("/", locale))}`;
  const text = `${subject}\n${t.lostBodyText}\n\n${t.lostCta} : ${url("/", locale)}`;
  return { subject, html: layout(locale, t.lostPreheader, inner), text };
}

// ---------------------------------------------------------------------------
// Privilège № 001 : offre privée au top bidder (voir Privilege_001.md)
// ---------------------------------------------------------------------------
export function serialOfferEmail(
  d: {
    dropNumber: number;
    title: string;
    exemplaires: number;
    supplementCents: number;
    expiresAt: string;
    offerId: string;
  },
  locale: EmailLocale = "fr"
): EmailContent {
  const t = copy(locale).serial;
  const num = formatDropNumber(d.dropNumber);
  const serial = `001/${String(d.exemplaires).padStart(3, "0")}`;
  const subject = t.subject(num);
  const offerUrl = url(`/account/offre/${d.offerId}`, locale);
  const rows = `${statRow(t.labelPiece, esc(d.title))}
${statRow(t.labelSerial, serial)}
${statRow(t.labelSupplement, formatEuros(d.supplementCents, locale))}
${statRow(t.labelExpires, fullTimestamp(d.expiresAt, locale))}`;
  const inner = `${eyebrow(`Drop No. ${num}`)}
${h1(t.h1)}
${p(t.intro(serial))}
${p(t.body, 18)}
${stats(rows)}
${button(t.cta, offerUrl)}
${textLink(t.keepLink, offerUrl)}`;
  const text = `${subject}

${t.introText(serial)}

${t.labelPiece} : ${d.title}
${t.labelSupplement} : ${formatEuros(d.supplementCents, locale)}
${t.labelExpires} : ${fullTimestamp(d.expiresAt, locale)}

${t.bodyText}

${t.cta} : ${offerUrl}`;
  return { subject, html: layout(locale, t.preheader, inner), text };
}

// ---------------------------------------------------------------------------
// US-22 : rappels événementiels (ouverture, T-24h, T-1h)
// ---------------------------------------------------------------------------
export function dropReminderEmail(
  d: {
    kind: "open" | "h72" | "h24" | "h1";
    dropNumber: number;
    title: string;
    dropId?: string;
  },
  locale: EmailLocale = "fr"
): EmailContent {
  const num = formatDropNumber(d.dropNumber);
  const c = copy(locale).reminder[d.kind];
  const subject = c.subject(num);
  const inner = `${eyebrow(`Drop No. ${num} · ${esc(d.title)}`)}
${h1(c.title)}
${p(c.body)}
${d.dropId ? button(c.cta, url(`/drop/${d.dropId}`, locale)) : ""}`;
  const text = `${subject}\n${c.body}${d.dropId ? `\n\n${c.cta} : ${url(`/drop/${d.dropId}`, locale)}` : ""}`;
  return { subject, html: layout(locale, c.title, inner), text };
}

// ---------------------------------------------------------------------------
// Alertes "montre" (visiteur sans compte, double opt-in)
// ---------------------------------------------------------------------------
export function alertConfirmEmail(
  d: {
    dropNumber: number;
    title: string;
    confirmUrl: string;
  },
  locale: EmailLocale = "fr"
): EmailContent {
  const t = copy(locale).alert;
  const num = formatDropNumber(d.dropNumber);
  const subject = t.confirmSubject(num);
  const inner = `${eyebrow(`Drop No. ${num} · ${esc(d.title)}`)}
${h1(t.confirmH1)}
${p(t.confirmBody(d.title))}
${button(t.confirmCta, d.confirmUrl)}
${p(t.confirmDisclaimer, 22)}`;
  const text = `${subject}\n\n${t.confirmCta} : ${d.confirmUrl}\n\n${t.confirmDisclaimer}`;
  return { subject, html: layout(locale, t.confirmPreheader, inner), text };
}

export function alertNoticeEmail(
  d: {
    kind: "open" | "lock";
    dropNumber: number;
    title: string;
    dropId: string;
    unsubscribeUrl: string;
  },
  locale: EmailLocale = "fr"
): EmailContent {
  const t = copy(locale).alert;
  const num = formatDropNumber(d.dropNumber);
  const c = t[d.kind];
  const inner = `${eyebrow(`Drop No. ${num} · ${esc(d.title)}`)}
${h1(c.title)}
${p(c.body)}
${button(c.cta, url(`/drop/${d.dropId}`, locale))}
${textLink(t.unsubscribe, d.unsubscribeUrl)}`;
  const text = `${c.subject(num)}\n${c.body}\n\n${c.cta} : ${url(`/drop/${d.dropId}`, locale)}\n${t.unsubscribe} : ${d.unsubscribeUrl}`;
  return { subject: c.subject(num), html: layout(locale, c.title, inner), text };
}
