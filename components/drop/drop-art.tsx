import Image from "next/image";

/**
 * Visuel de la piece. Si hero_image_url est present, on l'affiche ; sinon on
 * retombe sur un degrade editorial (les drops MVP n'ont pas tous d'image).
 */
export function DropArt({
  heroImageUrl,
  title,
}: {
  heroImageUrl: string | null;
  title: string;
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
    <div
      className="relative aspect-[4/5]"
      style={{
        background:
          "radial-gradient(ellipse at 35% 40%, oklch(0.78 0.05 80) 0%, transparent 50%), radial-gradient(ellipse at 65% 65%, oklch(0.42 0.04 60) 0%, transparent 55%), linear-gradient(160deg, oklch(0.28 0.02 60) 0%, oklch(0.16 0.012 60) 100%)",
      }}
      aria-hidden
    >
      <span className="absolute left-6 top-6 font-serif text-[13px] italic tracking-wide text-[oklch(0.95_0.005_80)]">
        {title}
      </span>
    </div>
  );
}
