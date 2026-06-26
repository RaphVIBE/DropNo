import React from "react";
import { interpolate, Easing } from "remotion";
import { C, serif, sans } from "../theme";

const OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Cadre fenêtre navigateur (barre + adresse), contenu en children. */
export const BrowserFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: 60,
      top: 48,
      width: 1800,
      height: 984,
      borderRadius: 18,
      overflow: "hidden",
      background: C.bg,
      boxShadow: "0 30px 80px rgba(33,27,18,0.18)",
      border: `1px solid ${C.line}`,
    }}
  >
    <div
      style={{
        height: 56,
        background: C.sand,
        borderBottom: `1px solid ${C.line}`,
        display: "flex",
        alignItems: "center",
        paddingLeft: 22,
        gap: 10,
      }}
    >
      {["#E6DFCF", "#E6DFCF", "#E6DFCF"].map((c, i) => (
        <div key={i} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />
      ))}
      <div
        style={{
          marginLeft: 22,
          height: 30,
          flex: "0 0 360px",
          background: C.bg,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          paddingLeft: 14,
          fontFamily: sans,
          fontSize: 16,
          color: C.muted,
        }}
      >
        dropno.eu
      </div>
    </div>
    <div style={{ position: "absolute", top: 56, left: 0, right: 0, bottom: 0 }}>
      {children}
    </div>
  </div>
);

/** Barre de navigation du site (à l'intérieur de la page). */
export const SiteNav: React.FC = () => (
  <div
    style={{
      height: 78,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 44px",
      borderBottom: `1px solid ${C.line}`,
    }}
  >
    <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 26, color: C.ink }}>
      Drop No.
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: 28, fontFamily: sans, fontSize: 16, color: C.inkSoft }}>
      <span>Calendrier</span>
      <span>Maisons</span>
      <span>Mécanisme</span>
      <span>À propos</span>
      <span
        style={{
          background: C.ink,
          color: C.bg,
          padding: "9px 18px",
          borderRadius: 6,
          fontSize: 14,
          letterSpacing: 1,
        }}
      >
        SE CONNECTER
      </span>
    </div>
  </div>
);

/** Curseur fléché. */
export const Cursor: React.FC<{ x: number; y: number; opacity?: number }> = ({
  x,
  y,
  opacity = 1,
}) => (
  <svg
    width={34}
    height={34}
    viewBox="0 0 24 24"
    style={{ position: "absolute", left: x, top: y, opacity, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))" }}
  >
    <path d="M3 2 L3 20 L8 15 L11.5 22 L14 21 L10.5 14 L17 14 Z" fill={C.ink} stroke={C.bg} strokeWidth={1.2} />
  </svg>
);

/** Onde de clic (anneau champagne qui s'agrandit et s'efface). */
export const ClickRipple: React.FC<{ x: number; y: number; frame: number; at: number }> = ({
  x,
  y,
  frame,
  at,
}) => {
  const p = interpolate(frame, [at, at + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: OUT,
  });
  if (frame < at || frame > at + 16) return null;
  const size = 12 + p * 46;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: 99,
        border: `2px solid ${C.champ}`,
        opacity: 1 - p,
      }}
    />
  );
};
