// Helpers d'animation (interpolate uniquement — pas de CSS transitions).
import { interpolate, Easing } from "remotion";

const OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Fondu + montée douce, à partir de `start` (frames locales). */
export const rise = (
  frame: number,
  start: number,
  dur = 18,
  dist = 26
): React.CSSProperties => ({
  opacity: interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: OUT,
  }),
  transform: `translateY(${interpolate(
    frame,
    [start, start + dur],
    [dist, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: OUT }
  )}px)`,
});

/** Fondu simple. */
export const fade = (frame: number, start: number, dur = 15): number =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: OUT,
  });

/** Fondu d'entrée puis de sortie sur une scène de `total` frames. */
export const fadeInOut = (frame: number, total: number, edge = 14): number => {
  const i = interpolate(frame, [0, edge], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const o = interpolate(frame, [total - edge, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(i, o);
};
