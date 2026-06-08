import { fromAddress, getResend, isEmailConfigured } from "./client";
import {
  bidConfirmationEmail,
  dropResultEmail,
  dropReminderEmail,
  alertConfirmEmail,
  alertNoticeEmail,
  type EmailContent,
} from "./templates";

type SendResult =
  | { ok: true; id?: string }
  | { ok: false; skipped?: true; error?: string };

async function deliver(to: string, content: EmailContent): Promise<SendResult> {
  // Best-effort : sans clé Resend (dev), on no-op sans casser l'appelant.
  if (!isEmailConfigured()) {
    console.warn(`[email] RESEND_API_KEY absente, email non envoyé: ${content.subject}`);
    return { ok: false, skipped: true };
  }
  try {
    const { data, error } = await getResend().emails.send({
      from: fromAddress(),
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
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
  data: Parameters<typeof bidConfirmationEmail>[0]
): Promise<SendResult> {
  return deliver(to, bidConfirmationEmail(data));
}

export function sendDropResult(
  to: string,
  data: Parameters<typeof dropResultEmail>[0]
): Promise<SendResult> {
  return deliver(to, dropResultEmail(data));
}

export function sendDropReminder(
  to: string,
  data: Parameters<typeof dropReminderEmail>[0]
): Promise<SendResult> {
  return deliver(to, dropReminderEmail(data));
}

export function sendAlertConfirm(
  to: string,
  data: Parameters<typeof alertConfirmEmail>[0]
): Promise<SendResult> {
  return deliver(to, alertConfirmEmail(data));
}

export function sendAlertNotice(
  to: string,
  data: Parameters<typeof alertNoticeEmail>[0]
): Promise<SendResult> {
  return deliver(to, alertNoticeEmail(data));
}
