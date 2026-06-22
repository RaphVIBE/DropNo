"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { WatchArt } from "@/components/drop/watch-art";
import { PIECE_FRAME } from "@/components/brand/styles";

/**
 * Filigrane « Pour illustration » posé PAR-DESSUS la photo (motif texte
 * répété en diagonale). Utilisé uniquement en environnement de démo, pour que
 * le watermark fasse partie de l'image affichée, pas d'une légende HTML à côté.
 */
function PhotoWatermark({ label }: { label: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id={`wm-${id}`}
          width="240"
          height="150"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-30)"
        >
          <text
            x="0"
            y="80"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
            fontSize="20"
            fill="rgba(255,255,255,0.42)"
          >
            {label}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#wm-${id})`} />
    </svg>
  );
}

/**
 * Galerie de la pièce : visionneuse principale (cadre sombre encadré, cohérent
 * avec la carte de la home) + navigation adaptée au support :
 *   - mobile : carrousel swipe (scroll-snap) + points de pagination
 *   - desktop : rangée de miniatures cliquables
 * Source = hero_image_url puis images_urls (jsonb). Sans photo, on retombe sur
 * l'illustration WatchArt.
 */

// Cadre commun à la pièce (PIECE_FRAME) + ombre portée propre à la galerie.
const FRAME = `${PIECE_FRAME} shadow-[0_28px_80px_-30px_oklch(0.2_0.02_60/0.55)]`;

export function DropGallery({
  heroImageUrl,
  imagesUrls,
  title,
  seed = 0,
  watermark,
}: {
  heroImageUrl: string | null;
  imagesUrls: string[] | null;
  title: string;
  seed?: number;
  /** Filigrane « Pour illustration » sur les photos (démo uniquement). */
  watermark?: string;
}) {
  const t = useTranslations("dropDetail");
  const all = [heroImageUrl, ...(imagesUrls ?? [])].filter(
    (u): u is string => typeof u === "string" && u.length > 0
  );
  const images = Array.from(new Set(all));
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (track?.clientWidth) {
      track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    }
    setActive(i);
  }, []);

  // Throttle au rAF : une seule lecture de layout (clientWidth) par frame, et
  // garde contre une largeur nulle (transition responsive) qui donnerait NaN.
  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const track = trackRef.current;
      const w = track?.clientWidth ?? 0;
      if (!w) return;
      const i = Math.round(track!.scrollLeft / w);
      setActive((prev) => (prev === i ? prev : i));
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  if (images.length === 0) {
    return (
      <div className={`relative aspect-square overflow-hidden ${FRAME}`}>
        <WatchArt seed={seed} className="absolute inset-0 h-full w-full" />
        <span className="absolute left-6 top-6 font-serif text-[13px] italic tracking-wide text-[oklch(0.95_0.005_80)]">
          {title}
        </span>
        {watermark ? <PhotoWatermark label={watermark} /> : null}
      </div>
    );
  }

  const single = images.length === 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Visionneuse — une seule pièce, ou carrousel swipe (mobile) / piloté
          par les miniatures (desktop). */}
      <div
        ref={trackRef}
        onScroll={single ? undefined : onScroll}
        className={`flex overflow-x-auto overscroll-x-contain ${FRAME} ${
          single
            ? ""
            : "snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }`}
      >
        {images.map((url) => (
          <div
            key={url}
            className="relative aspect-square w-full shrink-0 snap-center overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {watermark ? <PhotoWatermark label={watermark} /> : null}
          </div>
        ))}
      </div>

      {/* Points de pagination — mobile, multi-photos. */}
      {!single ? (
        <div className="flex justify-center gap-2 md:hidden">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t("galleryThumbAria", {
                index: i + 1,
                total: images.length,
              })}
              aria-current={i === active}
              className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                i === active ? "w-6 bg-foreground" : "w-1.5 bg-rule hover:bg-ink-2"
              }`}
            />
          ))}
        </div>
      ) : null}

      {/* Miniatures — desktop, multi-photos. */}
      {!single ? (
        <ul className="hidden grid-cols-5 gap-3 md:grid">
          {images.map((url, i) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={t("galleryThumbAria", {
                  index: i + 1,
                  total: images.length,
                })}
                aria-current={i === active}
                className={`relative block aspect-square w-full overflow-hidden rounded-sm bg-card ring-1 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  i === active
                    ? "ring-foreground"
                    : "ring-rule-soft hover:ring-ink-2"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
