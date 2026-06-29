import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Masthead } from "@/components/brand/masthead";
import { getAllEssays } from "@/lib/essays";
import { formatShortDate } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/i18n/metadata";

export async function generateMetadata() {
  const t = await getTranslations("lire");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates("/lire", await getLocale()),
  };
}

/**
 * Index éditorial `/lire`. Liste les essais (frontmatter), du plus récent au
 * plus ancien. Masthead unifié + filigrane « scellé ». Bilingue : le corpus
 * est en français pour l'instant, l'index reste affiché sous /en (la rédaction
 * paraît d'abord en FR).
 */
export default async function ReadIndexPage() {
  const t = await getTranslations("lire");
  const locale = (await getLocale()) as Locale;
  const essays = await getAllEssays();

  return (
    <>
      <Masthead variant="seal">
        <span
          className="eyebrow reveal"
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
        >
          {t("eyebrow")}
        </span>
        <h1
          className="font-display reveal mt-5 max-w-[14ch] text-display-page"
          style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
        >
          {t("heroTitle")}
        </h1>
        <p
          className="reveal mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-2"
          style={{ "--reveal-delay": "380ms" } as React.CSSProperties}
        >
          {t("heroBody")}
        </p>
      </Masthead>

      <section className="px-7 py-16 md:px-16 md:py-24">
        {essays.length === 0 ? (
          <p className="text-ink-2">{t("empty")}</p>
        ) : (
          <ul className="mx-auto max-w-4xl">
            {essays.map((essay) => (
              <li key={essay.slug} className="border-b border-rule-soft">
                <Link
                  href={`/lire/${essay.slug}`}
                  className="group block py-9 transition-colors hover:bg-[oklch(0.99_0.004_80)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:py-11"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    {essay.category ? (
                      <span className="eyebrow text-champagne-deep">
                        {essay.category}
                      </span>
                    ) : null}
                    {essay.publishedAt ? (
                      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {formatShortDate(essay.publishedAt, locale)}
                      </span>
                    ) : null}
                    {essay.readingTime ? (
                      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {t("readingTime", { minutes: essay.readingTime })}
                      </span>
                    ) : null}
                  </div>
                  <h2
                    lang={essay.lang}
                    className="font-serif mt-3 max-w-[24ch] text-[clamp(1.6rem,3.4vw,2.4rem)] italic leading-tight text-foreground transition-transform group-hover:translate-x-0.5"
                  >
                    {essay.title}
                  </h2>
                  {essay.summary ? (
                    <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-ink-2">
                      {essay.summary}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
