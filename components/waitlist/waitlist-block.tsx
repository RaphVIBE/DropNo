import { getTranslations } from "next-intl/server";

import { WaitlistForm } from "./waitlist-form";

/**
 * Bloc « le premier drop approche » + formulaire de liste d'attente.
 * Remplace l'état vide (aucun drop) sur la home et le calendrier au soft launch.
 */
export async function WaitlistBlock({ source }: { source: string }) {
  const t = await getTranslations("waitlist");
  return (
    <section className="border-t border-rule-soft px-7 py-16 md:px-16 md:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">{t("emptyEyebrow")}</p>
        <h2 className="font-display mt-4 text-[clamp(1.8rem,4vw,2.75rem)] leading-[1.08]">
          {t("emptyTitle")}
        </h2>
        <p className="mx-auto mt-5 max-w-[46ch] text-base leading-relaxed text-ink-2">
          {t("emptyBody")}
        </p>
        <div className="mx-auto mt-9 max-w-md text-left">
          <WaitlistForm source={source} />
        </div>
      </div>
    </section>
  );
}
