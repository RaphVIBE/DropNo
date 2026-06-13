import { getTranslations } from "next-intl/server";

import { Filigrane } from "@/components/brand/filigrane";
import { WaitlistForm } from "./waitlist-form";

/**
 * Bloc « le premier drop approche » + formulaire de liste d'attente.
 * Remplace l'état vide (aucun drop) sur la home et le calendrier au soft launch.
 *
 * `hero` : en l'absence de drop, ce bloc EST le héros de la home — titre en h1,
 * plus de présence verticale, filet d'art (filigrane).
 */
export async function WaitlistBlock({
  source,
  hero = false,
}: {
  source: string;
  hero?: boolean;
}) {
  const t = await getTranslations("waitlist");
  const Heading = hero ? "h1" : "h2";

  return (
    <section
      className={`relative overflow-hidden px-7 md:px-16 ${
        hero
          ? "pb-20 pt-14 md:pb-28 md:pt-20"
          : "border-t border-rule-soft py-16 md:py-24"
      }`}
    >
      {hero ? (
        <Filigrane className="reveal-art pointer-events-none absolute -right-12 top-1/2 z-0 h-64 w-64 -translate-y-1/2 text-[var(--champagne-deep)] [--art-opacity:0.07] md:-right-4 md:h-[22rem] md:w-[22rem]" />
      ) : null}
      <div
        className={`relative z-10 mx-auto text-center ${
          hero ? "max-w-2xl" : "max-w-xl"
        }`}
      >
        <p className="eyebrow">{t("emptyEyebrow")}</p>
        <Heading
          className={`font-display mt-4 leading-[1.04] ${
            hero
              ? "text-[clamp(2.4rem,6vw,4.5rem)]"
              : "text-[clamp(1.8rem,4vw,2.75rem)]"
          }`}
        >
          {t("emptyTitle")}
        </Heading>
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
