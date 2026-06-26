import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { Masthead } from "@/components/brand/masthead";
import { EssayProse } from "@/components/essays/essay-prose";
import { getAllEssays, getEssay } from "@/lib/essays";
import { formatShortDate } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { defaultOgImage, localizedAlternates, siteUrl } from "@/lib/i18n/metadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/structured-data";

/** Pré-rend chaque essai par slug (pour les deux locales via le layout). */
export async function generateStaticParams() {
  const essays = await getAllEssays();
  return essays.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const t = await getTranslations("lire");
  const essay = await getEssay(params.slug);
  if (!essay) return { title: t("notFoundMetaTitle") };
  const locale = (await getLocale()) as Locale;

  return {
    title: `${essay.title} · Drop No.`,
    description: essay.summary,
    // Un essai FR-only (pas de variante .en.md) ne déclare que `fr` : l'URL
    // /en/lire/[slug] sert le corps français, on évite donc un hreflang `en`
    // trompeur et on canonise vers la version FR.
    alternates: localizedAlternates(`/lire/${essay.slug}`, locale, [essay.lang]),
    openGraph: {
      type: "article",
      title: essay.title,
      description: essay.summary,
      url: `${siteUrl()}/lire/${essay.slug}`,
      ...(essay.publishedAt ? { publishedTime: essay.publishedAt } : {}),
      images: [{ url: defaultOgImage(), width: 1200, height: 630, alt: essay.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: essay.title,
      description: essay.summary,
      images: [defaultOgImage()],
    },
  };
}

/**
 * Article éditorial `/lire/[slug]`. Corps en serif Fraunces, colonne mesurée
 * pour la longue lecture. JSON-LD Article + BreadcrumbList.
 *
 * Langue : le corpus est en français ; sous /en on affiche une note discrète
 * signalant que l'essai n'est encore disponible qu'en français (plutôt que de
 * masquer la pièce et laisser /en/lire à demi vide).
 */
export default async function EssayPage({
  params,
}: {
  params: { slug: string };
}) {
  const t = await getTranslations("lire");
  const locale = (await getLocale()) as Locale;
  const essay = await getEssay(params.slug);
  if (!essay) notFound();

  const showFrenchNote = locale === "en" && essay.lang === "fr";

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          slug: essay.slug,
          title: essay.title,
          description: essay.summary,
          publishedAt: essay.publishedAt,
          inLanguage: essay.lang,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Drop No.", url: siteUrl() },
          { name: t("breadcrumbRead"), url: `${siteUrl()}/lire` },
          { name: essay.title, url: `${siteUrl()}/lire/${essay.slug}` },
        ])}
      />

      <Masthead variant="seal" padding="px-7 pb-12 pt-16 md:px-16 md:pb-16 md:pt-24">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/lire"
            className="reveal inline-flex w-fit items-center rounded-sm text-[11px] uppercase tracking-[0.18em] text-champagne-deep underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
          >
            {t("backToIndex")}
          </Link>
          <div className="reveal mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {essay.category ? (
              <span className="eyebrow text-champagne-deep">{essay.category}</span>
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
          <h1
            className="font-display reveal mt-5 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05]"
            style={{ "--reveal-delay": "180ms" } as React.CSSProperties}
          >
            {essay.title}
          </h1>
          {showFrenchNote ? (
            <p className="reveal mt-6 inline-flex items-center gap-2 border-l-2 border-champagne-deep/60 pl-3 text-sm text-muted-foreground">
              {t("frenchOnlyNote")}
            </p>
          ) : null}
        </div>
      </Masthead>

      <article
        className="px-7 py-14 md:px-16 md:py-20"
        lang={essay.lang}
      >
        <EssayProse body={essay.body} />
      </article>

      <section className="border-t border-rule-soft px-7 py-14 text-center md:px-16">
        <Link
          href="/lire"
          className="inline-flex items-center rounded-sm text-[13px] uppercase tracking-[0.16em] text-champagne-deep underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t("backToIndex")}
        </Link>
      </section>
    </>
  );
}
