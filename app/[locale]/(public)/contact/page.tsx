import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { localizedAlternates } from "@/lib/i18n/metadata";
import { Masthead } from "@/components/brand/masthead";

const CONTACT_EMAIL = "hello@dropno.eu";

const COPY = {
  fr: {
    metaTitle: "Contact · Drop No.",
    metaDescription:
      "Écrire à Drop No. (Veracruz SRL) : support acheteurs, partenariats maisons, presse.",
    eyebrow: "Drop No. · Contact",
    title: "Nous écrire",
    intro:
      "Une question sur un drop, un partenariat maison, une demande presse ? Écrivez-nous, nous répondons sous deux jours ouvrés.",
    emailLabel: "Email",
    cta: "Écrire à l'équipe",
    legalLabel: "Société",
    legalLines: [
      "Veracruz SRL, exploitant la marque Drop No.",
      "Route de Huy 134, 4287 Lincent, Belgique",
      "BCE / TVA : BE 0799.209.229",
    ],
  },
  en: {
    metaTitle: "Contact · Drop No.",
    metaDescription:
      "Get in touch with Drop No. (Veracruz SRL): buyer support, maison partnerships, press.",
    eyebrow: "Drop No. · Contact",
    title: "Get in touch",
    intro:
      "A question about a drop, a maison partnership, a press request? Write to us and we reply within two business days.",
    emailLabel: "Email",
    cta: "Email the team",
    legalLabel: "Company",
    legalLines: [
      "Veracruz SRL, operating the Drop No. brand",
      "Route de Huy 134, 4287 Lincent, Belgium",
      "Company / VAT no.: BE 0799.209.229",
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = COPY[locale === "en" ? "en" : "fr"];
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: localizedAlternates("/contact", locale),
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const t = COPY[locale === "en" ? "en" : "fr"];

  return (
    <>
      <Masthead variant="seal" padding="px-7 pb-14 pt-20 md:pb-16 md:pt-24">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1 className="font-display mt-4 text-[clamp(2.25rem,5vw,3.5rem)]">
            {t.title}
          </h1>
        </div>
      </Masthead>

      <section className="mx-auto max-w-3xl px-7 pb-28 pt-14 md:pt-16">
        <p className="max-w-prose text-lg leading-relaxed text-ink-2">
          {t.intro}
        </p>

        <div className="mt-10">
          <span className="eyebrow">{t.emailLabel}</span>
          <p className="mt-2">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-display rounded-sm text-2xl underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-6">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t.cta}
            </a>
          </p>
        </div>

        <div className="mt-16 border-t border-rule-soft pt-8">
          <span className="eyebrow">{t.legalLabel}</span>
          <address className="mt-3 not-italic text-sm leading-relaxed text-ink-2">
            {t.legalLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </div>
      </section>
    </>
  );
}
