import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos — Drop No.",
  description:
    "Drop No. est une maison de drops scellés pour montres premium, en direct des marques.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-2xl px-7 py-24 md:px-8 md:py-32">
      <span className="eyebrow">À propos</span>

      <h1 className="font-display mt-6 text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.95]">
        Une maison de drops scellés.
      </h1>

      <div className="mt-12 space-y-6 text-lg leading-relaxed text-ink-2">
        <p>
          Drop No. réunit, une fois par semaine, une marque et une pièce. Un
          nombre limité d&apos;exemplaires, un prix plancher, une fenêtre
          d&apos;offres de cinq jours. Chaque drop est numéroté, attendu,
          ritualisé.
        </p>
        <p>
          Vous soumettez une offre cachée, modifiable jusqu&apos;à la dernière
          heure. À la révélation, les offres les plus hautes l&apos;emportent et{" "}
          <span className="text-foreground">
            tous les gagnants payent le même prix
          </span>{" "}
          : celui de la dernière offre retenue. Pas de surenchère en temps réel,
          pas de guerre des prix. Un calendrier que vous pouvez tenir.
        </p>
        <p>
          Nous travaillons en direct avec les marques. Pas de revente, pas
          d&apos;intermédiaire : l&apos;authenticité vient de la maison
          elle-même. La pièce vous est livrée assurée, main propre lorsque sa
          valeur l&apos;exige.
        </p>
      </div>

      <div className="mt-16 border-t border-rule-soft pt-10">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Drop No. est édité depuis Paris. Pour toute question, écrivez-nous à{" "}
          <a
            href="mailto:hello@dropno.eu"
            className="text-champagne-deep underline-offset-4 hover:underline"
          >
            hello@dropno.eu
          </a>
          .
        </p>
        <Link
          href="/drops"
          className="mt-6 inline-block text-sm text-ink-2 underline-offset-4 transition-colors hover:text-foreground"
        >
          Voir le calendrier des drops →
        </Link>
      </div>
    </section>
  );
}
