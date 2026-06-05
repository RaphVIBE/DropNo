import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MechanismVariantB } from "@/components/home/mechanism-variant-b";

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

      {/* Mécanisme — flux blueprint vivant du drop scellé en trois temps */}
      <MechanismVariantB />
    </section>
  );
}
