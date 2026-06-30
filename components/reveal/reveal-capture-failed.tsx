import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { btnSolid } from "@/components/reveal/shared";

/*
 * Lock 2 — capture Stripe echouee au reveal. Ecran calme, sans detail
 * technique ni code d'erreur, sans bouton « reessayer » (l'enchere est close) :
 * clarte, phrase de soulagement, et un moyen de joindre un humain.
 * (cf. handoff, Decisions verrouillees § capture failure UX)
 */
export async function RevealCaptureFailed({
  dropNumber,
}: {
  dropNumber: number;
}) {
  const t = await getTranslations("reveal");
  return (
    <section className="mx-auto flex min-h-[68vh] max-w-[680px] flex-col items-center justify-center px-gutter py-20 text-center md:py-28">
      <p className="mb-8 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        {t("captureEyebrow", { number: dropNumber })}
      </p>
      <h1 className="mb-10 font-serif text-[clamp(40px,7vw,84px)] font-light italic leading-[0.98] tracking-[-0.03em]">
        {t("captureTitle")}
      </h1>
      <p className="mx-auto mb-6 max-w-[540px] text-[15px] leading-relaxed text-ink-2">
        {t("captureBody")}
      </p>
      <p className="mx-auto mb-12 max-w-[540px] text-[15px] leading-relaxed text-muted-foreground">
        {t.rich("captureContact", {
          link: (c) => (
            <a
              href="mailto:hello@dropno.eu"
              className="border-b border-rule pb-px text-ink-2 hover:text-foreground"
            >
              {c}
            </a>
          ),
        })}
      </p>
      <Link href="/drops" className={btnSolid}>
        {t("captureBack")}
      </Link>
    </section>
  );
}
