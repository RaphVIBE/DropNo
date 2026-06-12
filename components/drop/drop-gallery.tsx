"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { WatchArt } from "@/components/drop/watch-art";

/**
 * Galerie de la pièce : photo principale + miniatures. Source = hero_image_url
 * suivi de images_urls (jsonb). Sans photo, on retombe sur l'illustration
 * WatchArt (les drops MVP n'ont pas tous d'image).
 */
export function DropGallery({
  heroImageUrl,
  imagesUrls,
  title,
  seed = 0,
}: {
  heroImageUrl: string | null;
  imagesUrls: string[] | null;
  title: string;
  seed?: number;
}) {
  const t = useTranslations("dropDetail");
  const all = [heroImageUrl, ...(imagesUrls ?? [])].filter(
    (u): u is string => typeof u === "string" && u.length > 0
  );
  const images = Array.from(new Set(all));
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden">
        <WatchArt seed={seed} className="absolute inset-0 h-full w-full" />
        <span className="absolute left-6 top-6 font-serif text-[13px] italic tracking-wide text-[oklch(0.95_0.005_80)]">
          {title}
        </span>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-3">
          {images.map((url, i) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={t("galleryThumbAria", {
                  index: i + 1,
                  total: images.length,
                })}
                aria-current={i === active}
                className={`relative block aspect-square w-full overflow-hidden bg-card ring-1 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
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
