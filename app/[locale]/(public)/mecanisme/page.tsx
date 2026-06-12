import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { MechanismVariantB } from "@/components/home/mechanism-variant-b";
import { Filigrane } from "@/components/brand/filigrane";
import { formatEuros } from "@/lib/format";

export async function generateMetadata() {
  const t = await getTranslations("mecanisme");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

/**
 * Page pédagogique : le mécanisme sealed-bid uniform price expliqué en entier,
 * avec un exemple chiffré et une FAQ. Statique, aucune donnée.
 */

// Exemple chiffré : 5 exemplaires, plancher 3 000 €. Les montants sont en
// cents (convention CLAUDE.md), formatés à l'affichage.
const EXAMPLE_N = 5;
const EXAMPLE_FLOOR_CENTS = 300_000;
const EXAMPLE_BIDS_CENTS = [620_000, 540_000, 490_000, 460_000, 410_000, 380_000, 320_000];
const CLEARING_CENTS = EXAMPLE_BIDS_CENTS[EXAMPLE_N - 1];

const FAQ_KEYS = ["lose", "preauth", "identity", "edit", "winners", "withdraw", "fees"] as const;

export default async function MechanismPage() {
  const t = await getTranslations("mecanisme");
  const locale = await getLocale();

  const FAQ = FAQ_KEYS.map((k) => ({
    q: t(`faq.${k}.q`),
    a: t(`faq.${k}.a`),
  }));

  const STEPS = (["open", "sealed", "lock", "reveal"] as const).map((k) => ({
    t: t(`timeline.${k}.t`),
    title: t(`timeline.${k}.title`),
    body: t(`timeline.${k}.body`),
  }));

  return (
    <>
      {/* En-tête éditorial */}
      <div className="relative overflow-hidden border-b border-rule-soft px-7 pb-16 pt-20 md:px-16 md:pb-20 md:pt-28">
        <Filigrane className="reveal-art pointer-events-none absolute -right-10 top-1/2 z-0 h-60 w-60 -translate-y-1/2 text-[var(--champagne-deep)] [--art-opacity:0.07] md:-right-4 md:h-80 md:w-80" />
        <div className="relative z-10">
          <span
            className="eyebrow reveal"
            style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
          >
            {t("eyebrow")}
          </span>
          <h1
            className="font-display reveal mt-6 max-w-[14ch] text-[clamp(2.75rem,7vw,5.5rem)]"
            style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
          >
            {t("heroTitle")}
          </h1>
          <p
            className="reveal mt-6 max-w-[54ch] text-lg leading-relaxed text-ink-2"
            style={{ "--reveal-delay": "380ms" } as React.CSSProperties}
          >
            {t("heroBody")}
          </p>
        </div>
      </div>

      {/* Les trois temps */}
      <section className="px-7 py-16 md:px-16 md:py-20">
        <MechanismVariantB />
      </section>

      {/* Exemple chiffré */}
      <section className="border-t border-rule-soft px-7 py-16 md:px-16 md:py-24">
        <div className="grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr] md:gap-24">
          <div>
            <span className="eyebrow">{t("example.eyebrow")}</span>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,2.75rem)]">
              {t("example.title")}
            </h2>
            <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-ink-2">
              {t.rich("example.body", {
                n: EXAMPLE_N,
                floor: formatEuros(EXAMPLE_FLOOR_CENTS, locale),
                clearing: formatEuros(CLEARING_CENTS, locale),
                strong: (chunks) => (
                  <span className="text-foreground">{chunks}</span>
                ),
              })}
            </p>
          </div>

          <ol className="self-start" aria-label={t("example.listLabel")}>
            {EXAMPLE_BIDS_CENTS.map((cents, i) => {
              const rank = i + 1;
              const isWinner = rank <= EXAMPLE_N;
              const isClearing = rank === EXAMPLE_N;
              return (
                <li
                  key={cents}
                  className={`flex items-baseline justify-between gap-4 border-b border-rule-soft py-3.5 ${
                    isClearing ? "border-b-champagne-deep" : ""
                  }`}
                >
                  <span className="flex items-baseline gap-4">
                    <span className="w-6 shrink-0 font-serif text-sm italic tabular-nums text-muted-foreground">
                      {String(rank).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-serif text-xl italic tabular-nums ${
                        isWinner ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {formatEuros(cents, locale)}
                    </span>
                  </span>
                  <span
                    className={`text-[11px] uppercase tracking-[0.18em] ${
                      isClearing
                        ? "text-champagne-deep"
                        : isWinner
                          ? "text-ink-2"
                          : "text-muted-foreground"
                    }`}
                  >
                    {isClearing
                      ? t("example.tagClearing", {
                          price: formatEuros(CLEARING_CENTS, locale),
                        })
                      : isWinner
                        ? t("example.tagWinner", {
                            price: formatEuros(CLEARING_CENTS, locale),
                          })
                        : t("example.tagReleased")}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Chronologie d'un drop */}
      <section className="border-t border-rule-soft px-7 py-16 md:px-16 md:py-24">
        <span className="eyebrow">{t("timeline.eyebrow")}</span>
        <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,2.75rem)]">
          {t("timeline.title")}
        </h2>
        <ol className="mt-10 grid max-w-5xl grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10">
          {STEPS.map((step, i) => (
            <li key={step.t} className="border-t border-rule pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {step.t}
                </span>
                <span className="font-serif text-sm italic tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-3 font-serif text-xl italic">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="border-t border-rule-soft px-7 py-16 md:px-16 md:py-24">
        <div className="grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr] md:gap-24">
          <div>
            <span className="eyebrow">{t("faq.eyebrow")}</span>
            <h2 className="font-display mt-4 text-[clamp(1.9rem,4vw,2.75rem)]">
              {t("faq.title")}
            </h2>
          </div>
          <div>
            {FAQ.map((item) => (
              <details key={item.q} className="group border-b border-rule-soft">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 rounded-sm py-5 [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <span className="font-serif text-lg italic transition-colors group-hover:text-champagne-deep">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-6 text-[15px] leading-relaxed text-ink-2">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-rule-soft px-7 py-20 text-center md:px-16 md:py-28">
        <p className="font-display mx-auto max-w-[20ch] text-[clamp(1.75rem,4vw,2.75rem)]">
          {t("cta.title")}
        </p>
        <Link
          href="/drops"
          className="mt-9 inline-block bg-primary px-10 py-[18px] text-[13px] font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-[oklch(0.12_0.012_60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t("cta.button")}
        </Link>
      </section>
    </>
  );
}
