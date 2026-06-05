import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WatchArt } from "@/components/drop/watch-art";

export default function HomePage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl grid-cols-1 items-center gap-12 px-7 py-20 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:px-16">
      <div className="flex min-w-0 flex-col gap-10">
        <p className="eyebrow reveal" style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
          Maison de drops scellés · horlogerie premium
        </p>
        <h1
          className="font-display reveal max-w-3xl text-balance text-5xl md:text-7xl"
          style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
        >
          Une pièce. Un prix unique. Décidé à la révélation.
        </h1>
        <p
          className="reveal max-w-xl text-lg text-ink-2"
          style={{ "--reveal-delay": "440ms" } as React.CSSProperties}
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
            style={{ "--reveal-delay": "600ms" } as React.CSSProperties}
          >
            <Link href="/drops">Voir le calendrier</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="reveal"
            style={{ "--reveal-delay": "700ms" } as React.CSSProperties}
          >
            <Link href="/login">Rejoindre</Link>
          </Button>
        </div>
      </div>

      <div
        className="reveal-art relative aspect-[4/3] w-full overflow-hidden rounded-sm ring-1 ring-rule-soft md:mx-auto md:aspect-[4/5] md:max-w-sm"
        style={{ "--reveal-delay": "320ms" } as React.CSSProperties}
      >
        <WatchArt seed={1} className="absolute inset-0 h-full w-full" />
      </div>
    </section>
  );
}
