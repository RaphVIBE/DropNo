import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { localizedAlternates } from "@/lib/i18n/metadata";
import { Masthead } from "@/components/brand/masthead";
import { ContactForm, type ContactFormCopy } from "@/components/contact/contact-form";

type Channel = {
  eyebrow: string;
  title: string;
  body: string;
  email: string;
};

type ContactCopy = {
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  channels: Channel[];
  slaTitle: string;
  slaMeta: string;
  form: ContactFormCopy;
};

const FORM_ERRORS_FR: ContactFormCopy["errors"] = {
  invalid_name: "Nom trop court.",
  invalid_email: "Email invalide.",
  invalid_subject: "Sujet trop court.",
  invalid_message: "Message trop court, au moins 20 caractères.",
  invalid_reason: "Veuillez sélectionner une option.",
  rate_limited: "Trop de messages envoyés. Réessayez dans une heure.",
  generic: "Envoi impossible pour le moment. Réessayez plus tard.",
};

const FORM_ERRORS_EN: ContactFormCopy["errors"] = {
  invalid_name: "Name too short.",
  invalid_email: "Invalid email.",
  invalid_subject: "Subject too short.",
  invalid_message: "Message too short, at least 20 characters.",
  invalid_reason: "Please select an option.",
  rate_limited: "Too many messages sent. Try again in an hour.",
  generic: "Could not send right now. Please try again later.",
};

const COPY: Record<"fr" | "en", ContactCopy> = {
  fr: {
    metaTitle: "Contact · Drop No.",
    metaDescription:
      "Écrire à Drop No. (Veracruz SRL) : proposer un drop, question collectionneur, presse.",
    heroEyebrow: "Contact",
    heroTitle: "Écrivez-nous.",
    heroLede:
      "Drop No. est une petite équipe. Vous recevrez toujours une réponse d'une personne réelle, jamais d'un service. Voici les bonnes adresses, selon la raison de votre message.",
    channels: [
      {
        eyebrow: "Vous êtes une marque",
        title: "Proposer un drop",
        body: "Pour discuter d'un drop de votre nouvelle référence, d'une édition limitée, ou d'une collaboration.",
        email: "raph@dropno.eu",
      },
      {
        eyebrow: "Vous êtes collectionneur",
        title: "Question, compte, commande",
        body: "Pour toute question sur le fonctionnement, votre vérification d'identité, votre offre ou une livraison.",
        email: "hello@dropno.eu",
      },
      {
        eyebrow: "Vous êtes journaliste",
        title: "Presse et interview",
        body: "Pour une interview, un dossier de presse, une demande d'invitation à un drop. Réponse sous 24h ouvrées.",
        email: "hello@dropno.eu",
      },
    ],
    slaTitle: "Bruxelles. Un humain. Quarante-huit heures.",
    slaMeta: "Lundi au vendredi, 9h à 18h CET. Hors jours fériés belges.",
    form: {
      eyebrow: "Ou simplement",
      title: "Laissez un message.",
      intro:
        "Une réponse dans les quarante-huit heures ouvrées, depuis Bruxelles. Pas de bot, pas de réponse automatique.",
      reasonLabel: "Vous êtes",
      reasons: [
        { value: "brand", label: "Une marque" },
        { value: "collector", label: "Collectionneur" },
        { value: "press", label: "Journaliste" },
        { value: "other", label: "Autre" },
      ],
      nameLabel: "Nom",
      emailLabel: "Email",
      subjectLabel: "Sujet",
      messageLabel: "Message",
      submit: "Envoyer",
      submitting: "Envoi…",
      success: "Reçu. Vous recevrez une réponse dans les 48 heures ouvrées.",
      privacyNote: "Vos données ne servent qu'à vous répondre.",
      privacyHref: "/privacy-policy",
      privacyLinkText: "Politique de confidentialité",
      errors: FORM_ERRORS_FR,
    },
  },
  en: {
    metaTitle: "Contact · Drop No.",
    metaDescription:
      "Get in touch with Drop No. (Veracruz SRL): pitch a drop, collector question, press.",
    heroEyebrow: "Contact",
    heroTitle: "Get in touch.",
    heroLede:
      "Drop No. is a small team. You will always get a reply from a real person, never from a service desk. Here are the right addresses, depending on why you are writing.",
    channels: [
      {
        eyebrow: "You are a brand",
        title: "Pitch a drop",
        body: "To discuss a drop of your new reference, a limited edition, or a collaboration.",
        email: "raph@dropno.eu",
      },
      {
        eyebrow: "You are a collector",
        title: "Question, account, order",
        body: "For any question about how it works, your identity verification, your bid or a delivery.",
        email: "hello@dropno.eu",
      },
      {
        eyebrow: "You are a journalist",
        title: "Press and interviews",
        body: "For an interview, a press kit, or an invitation to a drop. Reply within 24 business hours.",
        email: "hello@dropno.eu",
      },
    ],
    slaTitle: "Brussels. A human. Forty-eight hours.",
    slaMeta: "Monday to Friday, 9am to 6pm CET. Excluding Belgian public holidays.",
    form: {
      eyebrow: "Or simply",
      title: "Leave a message.",
      intro:
        "A reply within forty-eight business hours, from Brussels. No bot, no auto-reply.",
      reasonLabel: "You are",
      reasons: [
        { value: "brand", label: "A brand" },
        { value: "collector", label: "A collector" },
        { value: "press", label: "A journalist" },
        { value: "other", label: "Other" },
      ],
      nameLabel: "Name",
      emailLabel: "Email",
      subjectLabel: "Subject",
      messageLabel: "Message",
      submit: "Send",
      submitting: "Sending…",
      success: "Received. You will get a reply within 48 business hours.",
      privacyNote: "Your data is only used to reply to you.",
      privacyHref: "/en/privacy-policy",
      privacyLinkText: "Privacy policy",
      errors: FORM_ERRORS_EN,
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = COPY[locale === "en" ? "en" : "fr"];
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: localizedAlternates("/contact", locale),
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const c = COPY[locale === "en" ? "en" : "fr"];

  return (
    <>
      <Masthead variant="seal" padding="px-7 pb-14 pt-20 md:pb-16 md:pt-24">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">{c.heroEyebrow}</span>
          <h1 className="font-display mt-4 text-display-page">
            {c.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            {c.heroLede}
          </p>
        </div>
      </Masthead>

      <section className="mx-auto max-w-3xl px-7 pb-12 pt-14 md:pt-16">
        <div className="grid gap-10 sm:grid-cols-3">
          {c.channels.map((ch) => (
            <div key={ch.eyebrow}>
              <span className="eyebrow">{ch.eyebrow}</span>
              <h3 className="font-display mt-3 text-xl italic">{ch.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{ch.body}</p>
              <a
                href={`mailto:${ch.email}`}
                className="mt-3 inline-block rounded-sm text-sm underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ch.email}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-elev">
        <div className="mx-auto max-w-3xl px-7 py-16 md:py-20">
          <ContactForm copy={c.form} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-7 py-16 text-center md:py-20">
        <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] italic leading-tight">
          {c.slaTitle}
        </h2>
        <p className="mt-4 text-sm uppercase tracking-wider text-ink-2">
          {c.slaMeta}
        </p>
      </section>
    </>
  );
}
