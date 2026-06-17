import { getTranslations } from "next-intl/server";

import { Filigrane } from "@/components/brand/filigrane";
import { Masthead } from "@/components/brand/masthead";
import { WaitlistForm } from "./waitlist-form";

/**
 * « La Liste » — l'accès anticipé aux drops. Ce n'est pas une newsletter :
 * on entre sur une liste et le prochain drop vous est annoncé avant tout le
 * monde. Remplace l'état vide (aucun drop) sur la home et le calendrier.
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

  const perks = [
    { title: t("perkFirstTitle"), body: t("perkFirstBody") },
    { title: t("perkRitualTitle"), body: t("perkRitualBody") },
    { title: t("perkQuietTitle"), body: t("perkQuietBody") },
  ];

  const Body = (
    <div className={`mx-auto text-center ${hero ? "max-w-2xl" : "max-w-xl"}`}>
      <p className="eyebrow">{t("kicker")}</p>
      <Heading
        className={`font-display mt-4 leading-[1.04] ${
          hero
            ? "text-[clamp(2.6rem,6.5vw,4.75rem)]"
            : "text-[clamp(1.9rem,4vw,2.9rem)]"
        }`}
      >
        {t("name")}
      </Heading>
      <p className="font-serif mt-4 text-[clamp(1.05rem,2.4vw,1.4rem)] italic text-[var(--champagne-deep)]">
        {t("tagline")}
      </p>
      <p className="mx-auto mt-5 max-w-[48ch] text-base leading-relaxed text-ink-2">
        {t("heroBody")}
      </p>

      {/* Les trois privilèges — ce qui distingue la Liste d'une newsletter. */}
      <ul className="mx-auto mt-9 grid max-w-xl grid-cols-1 gap-6 text-left sm:grid-cols-3 sm:gap-7">
        {perks.map((p) => (
          <li key={p.title} className="border-t border-rule-soft pt-3">
            <p className="text-sm font-medium text-foreground">{p.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
              {p.body}
            </p>
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-10 max-w-md text-left">
        <WaitlistForm source={source} />
      </div>
    </div>
  );

  // En héros (home sans drop) : bande sable + filigrane « calibre ».
  if (hero) {
    return (
      <Masthead variant="movement" padding="px-7 pb-20 pt-14 md:px-16 md:pb-28 md:pt-20">
        {Body}
      </Masthead>
    );
  }

  // En pied de page / état vide secondaire : reste en clair.
  return (
    <section className="relative overflow-hidden border-t border-rule-soft px-7 py-16 md:px-16 md:py-24">
      <Filigrane className="reveal-art pointer-events-none absolute -right-12 top-1/2 z-0 h-64 w-64 -translate-y-1/2 text-[var(--champagne-deep)] [--art-opacity:0.07] md:-right-4 md:h-[22rem] md:w-[22rem]" />
      <div className="relative z-10">{Body}</div>
    </section>
  );
}
