"use client";

import { useEffect, useState } from "react";

type Parts = {
  done: boolean;
  d: number;
  h: number;
  m: number;
  s: number;
};

function partsUntil(targetMs: number, nowMs: number): Parts {
  let diff = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const d = Math.floor(diff / 86400);
  diff -= d * 86400;
  const h = Math.floor(diff / 3600);
  diff -= h * 3600;
  const m = Math.floor(diff / 60);
  const s = diff - m * 60;
  return { done: targetMs - nowMs <= 0, d, h, m, s };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function DropCountdown({
  targetIso,
  serverNowIso,
  variant = "compact",
  className,
}: {
  /** Instant cible (ex: drops.reveal_at), ISO UTC. */
  targetIso: string;
  /** "now" cote serveur au moment du rendu — corrige le skew d'horloge client. */
  serverNowIso: string;
  variant?: "compact" | "full";
  className?: string;
}) {
  const targetMs = Date.parse(targetIso);
  // Etat initial calcule depuis l'horloge serveur => SSR et 1er rendu client
  // concordent (pas de mismatch d'hydratation).
  const [parts, setParts] = useState<Parts>(() =>
    partsUntil(targetMs, Date.parse(serverNowIso))
  );

  useEffect(() => {
    // offset = decalage entre l'horloge serveur et l'horloge locale.
    const offset = Date.parse(serverNowIso) - Date.now();
    const tick = () => setParts(partsUntil(targetMs, Date.now() + offset));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs, serverNowIso]);

  if (parts.done) {
    return (
      <span className={className} suppressHydrationWarning>
        Révélation imminente
      </span>
    );
  }

  if (variant === "full") {
    return (
      <span
        className={`flex items-baseline gap-2 font-serif italic ${className ?? ""}`}
        suppressHydrationWarning
      >
        <Unit n={pad(parts.d)} u="j" />
        <Unit n={pad(parts.h)} u="h" />
        <Unit n={pad(parts.m)} u="min" />
        <Unit n={pad(parts.s)} u="s" />
      </span>
    );
  }

  // compact : "3j 14h 02min"
  return (
    <span
      className={`font-serif italic tabular-nums ${className ?? ""}`}
      suppressHydrationWarning
    >
      {parts.d}j {pad(parts.h)}h {pad(parts.m)}min
    </span>
  );
}

function Unit({ n, u }: { n: string; u: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-5xl leading-none not-italic">{n}</span>
      <span className="font-sans text-[13px] not-italic text-muted-foreground">
        {u}
      </span>
    </span>
  );
}
