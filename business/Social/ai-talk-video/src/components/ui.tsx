import React from "react";
import { C, serif, sans } from "../theme";

export const GoldTick: React.FC<{ width?: number }> = ({ width = 64 }) => (
  <div style={{ width, height: 4, background: C.champ }} />
);

export const Chevron: React.FC<{ size?: number; color?: string }> = ({
  size = 26,
  color = C.champ,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M8 4 L16 12 L8 20"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Bandeau de scène : wordmark + index, en haut. */
export const SceneHeader: React.FC<{ index: string }> = ({ index }) => (
  <div
    style={{
      position: "absolute",
      top: 56,
      left: 96,
      right: 96,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
    }}
  >
    <span
      style={{ fontFamily: serif, fontStyle: "italic", fontSize: 30, color: C.inkSoft }}
    >
      Drop No.
    </span>
    <span
      style={{
        fontFamily: sans,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 4,
        color: C.champ,
      }}
    >
      {index}
    </span>
  </div>
);

export const Display: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, size = 64, color = C.ink, style }) => (
  <div
    style={{
      fontFamily: serif,
      fontStyle: "italic",
      fontSize: size,
      lineHeight: 1.02,
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = C.muted,
}) => (
  <div
    style={{
      fontFamily: sans,
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: 3,
      color,
    }}
  >
    {children}
  </div>
);
