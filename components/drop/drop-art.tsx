import Image from "next/image";

import { WatchArt } from "@/components/drop/watch-art";

/**
 * Visuel de la piece. Si hero_image_url est present, on l'affiche ; sinon on
 * retombe sur une illustration de montre (les drops MVP n'ont pas tous
 * d'image). Le seed (drop_number) fixe la palette du visuel de remplacement.
 */
export function DropArt({
  heroImageUrl,
  title,
  seed = 0,
}: {
  heroImageUrl: string | null;
  title: string;
  seed?: number;
}) {
  if (heroImageUrl) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        <Image
          src={heroImageUrl}
          alt={title}
          fill
          sizes="(min-width: 1000px) 55vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] overflow-hidden">
      <WatchArt seed={seed} className="absolute inset-0 h-full w-full" />
      <span className="absolute left-6 top-6 font-serif text-[13px] italic tracking-wide text-[oklch(0.95_0.005_80)]">
        {title}
      </span>
    </div>
  );
}
