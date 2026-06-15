import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Masthead } from "@/components/brand/masthead";
import { localizedAlternates } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates("/a-propos", await getLocale()),
  };
}

const LINK_FOCUS =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <>
      {/* En-tête — bande sable + filigrane « vue éclatée » */}
      <Masthead variant="exploded" padding="px-7 pb-16 pt-20 md:px-16 md:pb-20 md:pt-28">
        <div className="mx-auto max-w-2xl">
          <span
            className="eyebrow reveal"
            style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
          >
            {t("eyebrow")}
          </span>
          <h1
            className="font-display reveal mt-6 text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.95]"
            style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
          >
            {t("title")}
          </h1>
        </div>
      </Masthead>

      {/* Corps éditorial — clair */}
      <section className="mx-auto max-w-2xl px-7 py-20 md:py-24">
        <div className="space-y-6 text-lg leading-relaxed text-ink-2">
          <p>{t("para1")}</p>
          <p>
            {t("para2Lead")}{" "}
            <span className="text-foreground">{t("para2Emphasis")}</span>
            {" "}
            {t("para2Tail")}
          </p>
          <p>{t("para3")}</p>
        </div>

        <div className="mt-16 border-t border-rule-soft pt-10">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("contactLead")}{" "}
            <a
              href="mailto:hello@dropno.eu"
              className={`text-champagne-deep underline-offset-4 hover:underline ${LINK_FOCUS}`}
            >
              hello@dropno.eu
            </a>
            .
          </p>
          <Link
            href="/drops"
            className={`mt-6 inline-block text-sm text-ink-2 underline-offset-4 transition-colors hover:text-foreground ${LINK_FOCUS}`}
          >
            {t("calendarLink")}
          </Link>
        </div>
      </section>
    </>
  );
}
