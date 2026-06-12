import { WatchArt } from "@/components/drop/watch-art";
import { formatDropNumber } from "@/lib/format";

/**
 * Visuel d'un drop dans les listes (calendrier, home, cartes à venir).
 * Photo réelle de la pièce quand la maison l'a fournie (hero_image_url),
 * sinon l'illustration générative WatchArt. En mode « tease » (ouverture à
 * plus d'une semaine), on ne dévoile rien : illustration floutée + verrou,
 * même si une photo existe déjà.
 *
 * À placer dans un conteneur `relative overflow-hidden` (le parent porte le
 * ratio, le fond et le ring). Le ribbon No. garantit le contraste sur photo
 * claire comme sombre.
 */
export function DropVisual({
  dropNumber,
  title,
  heroImageUrl,
  teaseLocked = false,
  compact = false,
}: {
  dropNumber: number;
  title: string;
  heroImageUrl?: string | null;
  teaseLocked?: boolean;
  compact?: boolean;
}) {
  const motion =
    "absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]";

  return (
    <>
      {heroImageUrl && !teaseLocked ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImageUrl}
          alt={title}
          loading="lazy"
          className={`${motion} object-cover`}
        />
      ) : (
        <WatchArt
          seed={dropNumber}
          className={`${motion} ${teaseLocked ? "scale-110 blur-[8px]" : ""}`}
        />
      )}

      <span
        className={`absolute rounded-full bg-[oklch(0.16_0.012_60)]/72 font-serif italic text-[oklch(0.95_0.005_80)] ring-1 ring-[oklch(0.72_0.07_80)]/30 backdrop-blur-sm ${
          compact
            ? "left-2.5 top-2.5 px-2.5 py-0.5 text-xs"
            : "left-3 top-3 px-3 py-1 text-sm shadow-sm"
        }`}
      >
        No. {formatDropNumber(dropNumber)}
      </span>

      {teaseLocked ? (
        <span
          className="absolute inset-0 flex items-center justify-center bg-[oklch(0.16_0.012_60)]/35"
          aria-label="Visuel dévoilé une semaine avant l'ouverture"
        >
          <svg
            viewBox="0 0 24 24"
            className={compact ? "h-6 w-6 text-[oklch(0.95_0.005_80)]" : "h-7 w-7 text-[oklch(0.95_0.005_80)]"}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
      ) : null}
    </>
  );
}
