import { fromAddress, getResend, isEmailConfigured } from "./client";
import {
  bidConfirmationEmail,
  dropResultEmail,
  dropReminderEmail,
  alertConfirmEmail,
  alertNoticeEmail,
  avantPremiereEmail,
  serialOfferEmail,
  contactMessageEmail,
  type EmailContent,
  type EmailLocale,
} from "./templates";

/** Normalise une valeur de locale (depuis la DB) vers fr|en, défaut fr. */
export function emailLocale(raw: string | null | undefined): EmailLocale {
  return raw === "en" ? "en" : "fr";
}

type SendResult =
  | { ok: true; id?: string }
  | { ok: false; skipped?: true; error?: string };

async function deliver(
  to: string,
  content: EmailContent,
  opts?: { replyTo?: string; from?: string; headers?: Record<string, string> }
): Promise<SendResult> {
  // Best-effort : sans clé Resend (dev), on no-op sans casser l'appelant.
  if (!isEmailConfigured()) {
    console.warn(`[email] RESEND_API_KEY absente, email non envoyé: ${content.subject}`);
    return { ok: false, skipped: true };
  }
  try {
    const { data, error } = await getResend().emails.send({
      from: opts?.from ?? fromAddress(),
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      ...(opts?.replyTo ? { replyTo: opts.replyTo } : {}),
      ...(opts?.headers ? { headers: opts.headers } : {}),
    });
    if (error) {
      console.error("[email] échec d'envoi:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    console.error("[email] exception:", e);
    return { ok: false, error: e instanceof Error ? e.message : "erreur" };
  }
}

export function sendBidConfirmation(
  to: string,
  data: Parameters<typeof bidConfirmationEmail>[0],
  locale: EmailLocale = "fr"
): Promise<SendResult> {
  return deliver(to, bidConfirmationEmail(data, locale));
}

export function sendDropResult(
  to: string,
  data: Parameters<typeof dropResultEmail>[0],
  locale: EmailLocale = "fr"
): Promise<SendResult> {
  return deliver(to, dropResultEmail(data, locale));
}

export function sendSerialOffer(
  to: string,
  data: Parameters<typeof serialOfferEmail>[0],
  locale: EmailLocale = "fr"
): Promise<SendResult> {
  return deliver(to, serialOfferEmail(data, locale));
}

export function sendDropReminder(
  to: string,
  data: Parameters<typeof dropReminderEmail>[0],
  locale: EmailLocale = "fr"
): Promise<SendResult> {
  return deliver(to, dropReminderEmail(data, locale));
}

export function sendAlertConfirm(
  to: string,
  data: Parameters<typeof alertConfirmEmail>[0],
  locale: EmailLocale = "fr"
): Promise<SendResult> {
  return deliver(to, alertConfirmEmail(data, locale));
}

export function sendAlertNotice(
  to: string,
  data: Parameters<typeof alertNoticeEmail>[0],
  locale: EmailLocale = "fr"
): Promise<SendResult> {
  return deliver(to, alertNoticeEmail(data, locale));
}

export function sendAvantPremiere(
  to: string,
  data: Parameters<typeof avantPremiereEmail>[0],
  locale: EmailLocale = "fr"
): Promise<SendResult> {
  // Envoi de masse (toute la Liste) : Gmail/Yahoo EXIGENT List-Unsubscribe +
  // one-click (RFC 8058) depuis 2024, sinon spam direct malgré un DNS parfait.
  // Le lien https pointe sur l'endpoint POST one-click ; le mailto sert de repli.
  const unsub = data.unsubscribeUrl;
  const headers = unsub
    ? {
        "List-Unsubscribe": `<${unsub}>, <mailto:${process.env.RESEND_FROM_EMAIL ?? "hello@dropno.eu"}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      }
    : undefined;
  return deliver(to, avantPremiereEmail(data, locale), { headers });
}

/**
 * Message envoyé via le formulaire /contact, vers la boîte de l'équipe.
 * `replyTo` = email du visiteur (réponse en un clic depuis Gmail). From dédié
 * « Drop No. Contact » pour distinguer ces messages des emails transactionnels.
 */
export function sendContactMessage(
  to: string,
  data: Parameters<typeof contactMessageEmail>[0],
  replyTo: string,
  locale: EmailLocale = "fr"
): Promise<SendResult> {
  const from = `Drop No. Contact <${process.env.RESEND_FROM_EMAIL ?? "hello@dropno.eu"}>`;
  return deliver(to, contactMessageEmail(data, locale), { replyTo, from });
}
