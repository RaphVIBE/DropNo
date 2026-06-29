import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Masthead } from "@/components/brand/masthead";
import { getAllEssays } from "@/lib/essays";
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
  const essays = await getAllEssays();

  return (
    <>
      {/* En-tête — bande sable + filigrane « vue éclatée » */}
      <Masthead variant="exploded" padding="px-7 pb-14 pt-20 md:px-16 md:pb-16 md:pt-24">
        <div className="mx-auto max-w-2xl">
          <span
            className="eyebrow reveal"
            style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
          >
            {t("eyebrow")}
          </span>
          <h1
            className="font-display reveal mt-5 text-display-page"
            style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
          >
            {t("title")}
          </h1>
        </div>
      </Masthead>

      {/* Corps éditorial — clair */}
      <section className="mx-auto max-w-2xl px-7 py-16 md:py-20">
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

        {/* Annexe « Lectures » — discrète. Les essais vivaient sous /lire (retiré
            de la nav) ; ils restent accessibles ici et en direct. */}
        {essays.length > 0 ? (
          <aside aria-labelledby="reading-annex" className="mt-16 border-t border-rule-soft pt-10">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="reading-annex" className="eyebrow">{t("readingEyebrow")}</h2>
              <Link
                href="/lire"
                className={`text-[13px] text-ink-2 underline-offset-4 transition-colors hover:text-foreground ${LINK_FOCUS}`}
              >
                {t("readingAll")}
              </Link>
            </div>
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              {t("readingLead")}
            </p>
            <ul className="mt-6">
              {essays.map((essay) => (
                <li key={essay.slug} className="border-t border-rule-soft first:border-t-0">
                  <Link
                    href={`/lire/${essay.slug}`}
                    lang={essay.lang}
                    className={`group flex items-baseline justify-between gap-5 py-4 transition-colors hover:text-foreground ${LINK_FOCUS}`}
                  >
                    <span className="font-serif text-lg italic text-ink-2 transition-colors group-hover:text-foreground">
                      {essay.title}
                    </span>
                    {essay.readingTime ? (
                      <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {t("readingMinutes", { minutes: essay.readingTime })}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </section>
    </>
  );
}
