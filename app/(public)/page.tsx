import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Mécanisme du drop scellé, expliqué en trois temps sous le hero. */
const STEPS = [
  {
    n: "01",
    label: "Offre scellée",
    desc: "Vous scellez votre prix. Invisible des autres jusqu'à la révélation.",
  },
  {
    n: "02",
    label: "Révélation",
    desc: "À l'heure dite, toutes les offres s'ouvrent d'un seul coup.",
  },
  {
    n: "03",
    label: "Prix unique",
    desc: "Les plus hautes offres gagnent, et toutes payent le même prix.",
  },
];

export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl flex-col justify-center gap-14 px-7 py-20 md:gap-20 md:px-16">
      <div className="flex max-w-3xl flex-col gap-8">
        <p
          className="eyebrow reveal"
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
        >
          Maison de drops scellés · horlogerie premium
        </p>
        <h1
          className="font-display reveal text-balance text-5xl md:text-7xl"
          style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
        >
          Une pièce. Un prix unique. Décidé à la révélation.
        </h1>
        <p
          className="reveal max-w-xl text-lg text-ink-2"
          style={{ "--reveal-delay": "380ms" } as React.CSSProperties}
        >
          Chaque semaine, une marque ouvre un drop. Vous scellez votre offre.
          Les plus hautes gagnent, et toutes payent le même prix{" "}: la
          dernière offre retenue. Pas de surenchère, pas de guerre des prix.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button
            asChild
            size="lg"
            className="reveal"
            style={{ "--reveal-delay": "520ms" } as React.CSSProperties}
          >
            <Link href="/drops">Voir le calendrier</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="reveal"
            style={{ "--reveal-delay": "600ms" } as React.CSSProperties}
          >
            <Link href="/login">Rejoindre</Link>
          </Button>
        </div>
      </div>

      {/* Mécanisme — comprendre le drop scellé en trois temps */}
      <ol className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.n}
            className="reveal flex flex-col gap-3 border-t border-border pt-5"
            style={
              { "--reveal-delay": `${700 + i * 90}ms` } as React.CSSProperties
            }
          >
            <span className="font-display text-3xl tabular-nums text-[var(--champagne-deep)]">
              {step.n}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground">
              {step.label}
            </span>
            <p className="text-sm leading-relaxed text-ink-2">{step.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
