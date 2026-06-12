import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/**
 * Réassurance au point de décision : ce qui est compris quand on scelle une
 * offre à 3 000 €+. Volontairement discret (liste hairline, pas de cartes),
 * placé sous le formulaire d'offre.
 */

const ITEM_KEYS = [
  "authenticity",
  "delivery",
  "withdrawal",
  "buyerFees",
] as const;

export async function DropAssurance() {
  const t = await getTranslations("dropDetail");
  return (
    <div className="mt-8">
      <dl>
        {ITEM_KEYS.map((key) => (
          <div
            key={key}
            className="flex items-baseline gap-4 border-t border-rule-soft py-3"
          >
            <dt className="w-[92px] shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t(`assurance.${key}.label`)}
            </dt>
            <dd className="text-[13px] leading-relaxed text-ink-2">
              {t(`assurance.${key}.detail`)}
            </dd>
          </div>
        ))}
      </dl>
      <Link
        href="/mecanisme"
        className="mt-4 inline-block rounded-sm text-[13px] text-ink-2 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {t("howItWorks")}
      </Link>
    </div>
  );
}
