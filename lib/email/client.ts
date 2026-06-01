import { Resend } from "resend";

/**
 * Client Resend (singleton paresseux). Construit au premier appel seulement,
 * pour éviter de planter au build / en dev quand RESEND_API_KEY est absente.
 *
 * `isEmailConfigured()` permet aux appelants de no-op proprement (les emails
 * sont best-effort : un échec d'envoi ne doit jamais casser un flux métier
 * comme la soumission d'une offre).
 */
let resendSingleton: Resend | undefined;

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function getResend(): Resend {
  if (!resendSingleton) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY manquante");
    }
    resendSingleton = new Resend(key);
  }
  return resendSingleton;
}

/** Expéditeur par défaut. Surchargeable via RESEND_FROM_EMAIL. */
export function fromAddress(): string {
  const email = process.env.RESEND_FROM_EMAIL ?? "hello@dropno.com";
  return `Drop No. <${email}>`;
}
