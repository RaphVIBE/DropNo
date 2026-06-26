import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { LEGAL_DOCS } from "@/lib/legal";

/**
 * Pied de page global du site vitrine. Sobre, structuré par hairlines :
 * la maison, l'exploration, les engagements (réassurance), le légal.
 * Server Component, aucune dépendance client.
 */

const LINK_CLASS =
  "rounded-sm text-sm text-ink-2 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tw = await getTranslations("waitlist");
  const year = new Date().getFullYear();

  const explore = [
    { href: "/drops", label: t("exploreCalendar") },
    { href: "/marques", label: t("exploreHouses") },
    { href: "/mecanisme", label: t("exploreMechanism") },
    { href: "/lire", label: t("exploreRead") },
    { href: "/a-propos", label: t("exploreAbout") },
  ];

  const commitments = [
    t("commitment1"),
    t("commitment2"),
    t("commitment3"),
    t("commitment4"),
  ];

  return (
    <footer className="border-t border-rule bg-background">
      {/* Liste d'attente — un email à l'ouverture du premier drop */}
      <div className="border-b border-rule-soft px-7 py-12 md:px-16 md:py-14">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-12">
          <div>
            <p className="eyebrow">{tw("kicker")}</p>
            <p className="font-serif mt-2 text-2xl italic">{tw("name")}</p>
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-ink-2">
              {tw("footerBody")}
            </p>
          </div>
          <WaitlistForm source="footer" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-12 gap-y-12 px-7 py-16 md:grid-cols-[1.3fr_1fr_1.4fr] md:px-16 md:py-20">
        {/* La maison */}
        <div>
          <Link
            href="/"
            className="inline-block rounded-sm text-[26px] text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Wordmark />
          </Link>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-ink-2">
            {t("tagline")}
          </p>
          <a href="mailto:hello@dropno.eu" className={`mt-5 inline-block ${LINK_CLASS}`}>
            hello@dropno.eu
          </a>
        </div>

        {/* Explorer */}
        <nav aria-label={t("exploreTitle")}>
          <span className="eyebrow">{t("exploreTitle")}</span>
          <ul className="mt-5 space-y-3">
            {explore.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={LINK_CLASS}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Engagements */}
        <div>
          <span className="eyebrow">{t("commitmentsTitle")}</span>
          <ul className="mt-5 space-y-3">
            {commitments.map((c) => (
              <li key={c} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                <span
                  aria-hidden
                  className="mt-[9px] h-px w-4 shrink-0 bg-champagne-deep"
                />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Filet légal */}
      <div className="flex flex-col gap-4 border-t border-rule-soft px-7 py-7 md:flex-row md:items-baseline md:justify-between md:px-16">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL_DOCS.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/legal/${d.slug}`}
                className="rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
        <p className="shrink-0 text-xs text-muted-foreground">
          © {year} Drop No. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
