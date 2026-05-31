import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl flex-col justify-center gap-10 px-7 py-20 md:px-16">
      <p className="eyebrow">Maison de drops scellés — horlogerie premium</p>
      <h1 className="font-display max-w-3xl text-5xl md:text-7xl">
        Une pièce. Un prix unique. Décidé à la révélation.
      </h1>
      <p className="max-w-xl text-lg text-ink-2">
        Chaque semaine, une marque ouvre un drop. Vous scellez votre offre. Les
        plus hautes gagnent, et toutes payent le même prix : la dernière offre
        retenue. Pas de surenchère, pas de guerre des prix.
      </p>
      <div className="flex flex-wrap gap-4">
        <Button asChild size="lg">
          <Link href="/drops">Voir le calendrier</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Rejoindre</Link>
        </Button>
      </div>
    </section>
  );
}
