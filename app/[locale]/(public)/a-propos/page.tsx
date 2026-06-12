import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Filigrane } from "@/components/brand/filigrane";
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
    <section className="relative mx-auto max-w-2xl overflow-hidden px-7 py-24 md:py-32">
      <Filigrane className="reveal-art pointer-events-none absolute -right-12 top-12 z-0 h-44 w-44 text-[var(--champagne-deep)] [--art-opacity:0.08] md:-right-8 md:h-56 md:w-56" />

      <div className="relative z-10">
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

        <div
          className="reveal mt-12 space-y-6 text-lg leading-relaxed text-ink-2"
          style={{ "--reveal-delay": "360ms" } as React.CSSProperties}
        >
          <p>{t("para1")}</p>
          <p>
            {t("para2Lead")}{" "}
            <span className="text-foreground">{t("para2Emphasis")}</span>
            {" "}
            {t("para2Tail")}
          </p>
          <p>{t("para3")}</p>
        </div>

        <div
          className="reveal mt-16 border-t border-rule-soft pt-10"
          style={{ "--reveal-delay": "480ms" } as React.CSSProperties}
        >
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
      </div>
    </section>
  );
}
