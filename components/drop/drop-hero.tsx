import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatDropNumber, formatEuros, formatRevealMoment } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { Masthead } from "@/components/brand/masthead";

export type DropStatus = "draft" | "scheduled" | "open" | "closed" | "revealed" | "cancelled";

export async function DropHero({
  dropNumber,
  title,
  brandName,
  brandSlug,
  status,
  revealAt,
  clearingPriceCents,
}: {
  dropNumber: number;
  title: string;
  brandName: string | null;
  brandSlug?: string | null;
  status: DropStatus;
  revealAt: string | null;
  clearingPriceCents: number | null;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dropDetail");
  return (
    <Masthead variant="caseSection" padding="px-7 pt-16 md:px-16 md:pt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-rule pb-8">
        <span className="font-serif text-[32px] italic">
          Drop No. {formatDropNumber(dropNumber)}
        </span>
        <StatusLine
          status={status}
          revealAt={revealAt}
          clearingPriceCents={clearingPriceCents}
          t={t}
          locale={locale}
        />
      </div>
      <div className="pb-16 pt-10 md:pb-24 md:pt-14">
        {brandName ? (
          <div
            className="reveal mb-4 text-[13px] font-medium uppercase tracking-[0.22em] text-muted-foreground"
            style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
          >
            {brandSlug ? (
              <Link
                href={`/marques/${brandSlug}`}
                className="rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {brandName}
              </Link>
            ) : (
              brandName
            )}
          </div>
        ) : null}
        <h1
          className="font-display reveal max-w-[12ch] text-balance break-words text-[clamp(3.5rem,8vw,6.875rem)]"
          style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
        >
          {title}
        </h1>
      </div>
    </Masthead>
  );
}

function StatusLine({
  status,
  revealAt,
  clearingPriceCents,
  t,
  locale,
}: {
  status: DropStatus;
  revealAt: string | null;
  clearingPriceCents: number | null;
  t: Awaited<ReturnType<typeof getTranslations>>;
  locale: Locale;
}) {
  const base =
    "inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]";

  if (status === "open") {
    return (
      <span className={`${base} text-champagne-deep`}>
        <span className="status-dot" aria-hidden />
        {revealAt
          ? t("statusOpenClosing", {
              moment: formatRevealMoment(revealAt, locale),
            })
          : t("statusOpen")}
      </span>
    );
  }
  if (status === "scheduled") {
    return <span className={`${base} text-ink-2`}>{t("statusScheduled")}</span>;
  }
  if (status === "cancelled") {
    return (
      <span className={`${base} text-muted-foreground`}>
        {t("statusCancelled")}
      </span>
    );
  }
  // closed / revealed
  return (
    <span className={`${base} text-muted-foreground`}>
      {clearingPriceCents
        ? t("statusClosedPrice", {
            price: formatEuros(clearingPriceCents, locale),
          })
        : t("statusClosed")}
    </span>
  );
}
