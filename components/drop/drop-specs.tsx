import { getLocale, getTranslations } from "next-intl/server";

import { formatEuros } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

export async function DropSpecs({
  floorPriceCents,
  exemplaires,
}: {
  floorPriceCents: number;
  exemplaires: number;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dropDetail");
  return (
    <div className="mb-8 grid grid-cols-2">
      <Spec label={t("floorPrice")} value={formatEuros(floorPriceCents, locale)} />
      <Spec label={t("exemplaires")} value={String(exemplaires)} bordered />
    </div>
  );
}

function Spec({
  label,
  value,
  bordered,
}: {
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`border-t border-rule-soft py-[18px] ${
        bordered ? "border-l pl-4" : "pr-4"
      }`}
    >
      <div className="mb-1.5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="font-serif text-2xl italic">{value}</div>
    </div>
  );
}
