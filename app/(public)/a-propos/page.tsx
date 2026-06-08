import type { Metadata } from "next";
import Link from "next/link";

import { Filigrane } from "@/components/brand/filigrane";

export const metadata: Metadata = {
  title: "À propos — Drop No.",
  description:
    "Drop No. est une maison de drops scellés pour montres premium, en direct des marques.",
};

const LINK_FOCUS =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function AboutPage() {
  return (
    <section className="relative mx-auto max-w-2xl overflow-hidden px-7 py-24 md:py-32">
      <Filigrane className="reveal-art pointer-events-none absolute -right-12 top-12 z-0 h-44 w-44 text-[var(--champagne-deep)] opacity-[0.06] md:-right-8 md:h-56 md:w-56" />

      <div className="relative z-10">
        <span
          className="eyebrow reveal"
          style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
        >
          À propos
        </span>

        <h1
          className="font-display reveal mt-6 text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.95]"
          style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
        >
          Une maison de drops scellés.
        </h1>

        <div
          className="reveal mt-12 space-y-6 text-lg leading-relaxed text-ink-2"
          style={{ "--reveal-delay": "360ms" } as React.CSSProperties}
        >
          <p>
            Drop No. réunit, une fois par semaine, une marque et une pièce. Un
            nombre limité d&apos;exemplaires, un prix plancher, une fenêtre
            d&apos;offres de cinq jours. Chaque drop est numéroté, attendu,
            ritualisé.
          </p>
          <p>
            Vous soumettez une offre cachée, modifiable jusqu&apos;à la dernière
            heure. À la révélation, les offres les plus hautes l&apos;emportent
            et{" "}
            <span className="text-foreground">
              tous les gagnants payent le même prix
            </span>
            {" "}: celui de la dernière offre retenue. Pas de surenchère en
            temps réel, pas de guerre des prix. Un calendrier que vous pouvez
            tenir.
          </p>
          <p>
            Nous travaillons en direct avec les marques. Pas de revente, pas
            d&apos;intermédiaire : l&apos;authenticité vient de la maison
            elle-même. La pièce vous est livrée assurée, main propre lorsque sa
            valeur l&apos;exige.
          </p>
        </div>

        <div
          className="reveal mt-16 border-t border-rule-soft pt-10"
          style={{ "--reveal-delay": "480ms" } as React.CSSProperties}
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            Drop No. est édité depuis Paris. Pour toute question, écrivez-nous à{" "}
            <a
              href="mailto:hello@dropno.eu"
              className={`text-champagne-deep underline-offset-4 hover:underline ${LINK_FOCUS}`}
            >
              hello@dropno.eu
            </a>
            .
          </p>
          <Link
            href="/drops"
            className={`mt-6 inline-block text-sm text-ink-2 underline-offset-4 transition-colors hover:text-foreground ${LINK_FOCUS}`}
          >
            Voir le calendrier des drops →
          </Link>
        </div>
      </div>
    </section>
  );
}
