import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatAmount } from "@/lib/format";

/*
 * Briques partagees du parcours acheteur post-reveal (Track A).
 * Portees fidelement des maquettes mockups/dropno-buyer-reveal-*.html, mappees
 * sur les tokens vitrine (cf. globals.css + tailwind.config). Light only.
 *
 * La nav et le footer viennent du layout (public) — ces sections ne rendent
 * que le contenu entre les deux.
 */

/** Prix editorial : marque monetaire en exposant + entier groupe, Fraunces. */
export function BigPrice({ cents, locale }: { cents: number; locale: string }) {
  return (
    <div className="mb-[18px] font-serif text-[clamp(72px,11vw,152px)] font-light italic leading-[0.95] tracking-[-0.04em] tabular-nums text-champagne-deep">
      <span className="mr-[0.14em] align-[0.45em] text-[0.32em] tracking-normal text-ink-2">
        EUR
      </span>
      {formatAmount(cents, locale)}
    </div>
  );
}

/** Hero de resultat : eyebrow (champagne+etoile en victoire, sobre en perte),
 *  titre Fraunces (deux tailles), sous-titre, ligne meta optionnelle. */
export function RevealHero({
  tone,
  eyebrow,
  title,
  sub,
  meta,
}: {
  tone: "win" | "loss";
  eyebrow: string;
  title: string;
  sub: string;
  meta?: string;
}) {
  const isWin = tone === "win";
  return (
    <section className="mx-auto max-w-content px-gutter pb-14 pt-20 text-center md:pb-20 md:pt-28">
      <div
        className={`mb-10 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] ${
          isWin ? "text-champagne-deep" : "text-muted-foreground"
        }`}
      >
        {isWin ? (
          <span aria-hidden className="h-1 w-1 rotate-45 bg-champagne-deep" />
        ) : null}
        {eyebrow}
      </div>
      <h1
        className={`mb-7 font-serif font-light italic leading-[0.92] tracking-[-0.04em] ${
          isWin
            ? "text-[clamp(80px,14vw,196px)]"
            : "text-[clamp(64px,12vw,152px)]"
        }`}
      >
        {title}
      </h1>
      <p className="mx-auto max-w-[640px] font-serif text-[clamp(18px,2vw,24px)] italic leading-snug text-ink-2">
        {sub}
      </p>
      {meta ? (
        <p className="mt-9 text-[13px] tracking-[0.04em] text-muted-2">{meta}</p>
      ) : null}
    </section>
  );
}

/** Liste a trois temps (« What happens next » gagnant, « Three things » perdant).
 *  Heading/body acceptent du ReactNode (copy riche resolue par l'appelant). */
export function NumberedSteps({
  eyebrow,
  title,
  steps,
  foot,
  bordered = false,
}: {
  eyebrow: string;
  title: string;
  steps: { heading: ReactNode; body: ReactNode }[];
  foot?: ReactNode;
  bordered?: boolean;
}) {
  return (
    <section
      className={`mx-auto max-w-[880px] px-gutter py-14 md:py-24 ${
        bordered ? "border-t border-rule" : ""
      }`}
    >
      <p className="mb-4 text-center text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mb-12 text-center font-serif text-[clamp(32px,4.4vw,44px)] font-light italic leading-tight tracking-[-0.02em] md:mb-16">
        {title}
      </h2>
      <div>
        {steps.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-[56px_1fr] items-start gap-5 border-b border-rule-soft py-7 last:border-b-0 md:grid-cols-[80px_1fr] md:gap-8"
          >
            <div className="font-serif text-4xl font-light italic leading-none tabular-nums text-champagne-deep">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div>
              <div className="mb-1.5 text-[19px] font-medium text-foreground">
                {s.heading}
              </div>
              <div className="text-[15px] leading-relaxed text-ink-2">
                {s.body}
              </div>
            </div>
          </div>
        ))}
      </div>
      {foot ? (
        <p className="mt-12 text-center text-sm text-muted-foreground md:mt-14">
          {foot}
        </p>
      ) : null}
    </section>
  );
}

/** Carte « Coming Thursday » fermant les deux ecrans perdants. */
export async function NextDropCard() {
  const t = await getTranslations("reveal");
  return (
    <section className="border-t border-rule-soft bg-bg-deep px-gutter py-14 text-center md:py-24">
      <div className="mx-auto max-w-[720px]">
        <p className="mb-6 text-[11px] uppercase tracking-[0.28em] text-champagne-deep">
          {t("nextDropEyebrow")}
        </p>
        <h2 className="mb-4 font-serif text-[clamp(32px,4.4vw,48px)] font-light italic leading-tight tracking-[-0.022em]">
          {t("nextDropTitle")}
        </h2>
        <p className="mb-9 font-serif text-[17px] italic leading-snug text-ink-2">
          {t("nextDropSub")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/drops" className={btnSolid}>
            {t("nextDropCalendar")}
          </Link>
          <Link href="/" className={btnGhost}>
            {t("nextDropLetter")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* Boutons editoriaux : angles vifs, uppercase, tracking large (cf. mockup). */
export const btnSolid =
  "inline-flex items-center justify-center gap-2.5 border border-foreground bg-foreground px-7 py-4 text-xs font-medium uppercase tracking-[0.16em] text-background transition-opacity duration-200 ease-quart hover:opacity-[0.88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const btnGhost =
  "inline-flex items-center justify-center gap-2.5 border border-ink-2 bg-transparent px-7 py-4 text-xs font-medium uppercase tracking-[0.16em] text-ink-2 transition-colors duration-200 ease-quart hover:border-foreground hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
