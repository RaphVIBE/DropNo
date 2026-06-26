import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, serif, sans } from "../theme";
import { SceneHeader, GoldTick, Display } from "../components/ui";
import { rise } from "../anim";

// Les 4 temps de la démo (depuis decks/Drop-No-AI-Demo-Script.md).
const SCREENS: [string, string][] = [
  ["Home", "Manifesto hero when nothing is live — idea & ritual, not a sign-up wall."],
  ["Calendar", "Live · Upcoming · Past. Upcoming leads when nothing is open."],
  ["A drop", "Sealed-bid panel, countdown, and a result panel at the reveal."],
  ["Back-office", "Create a drop — the all-or-nothing toggle, backed by a migration & tests."],
];

export const Demo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <SceneHeader index="THE PRODUCT" />
      <div style={{ position: "absolute", left: 96, top: 150 }}>
        <div style={rise(f, 4)}>
          <GoldTick />
        </div>
        <div style={{ ...rise(f, 8), marginTop: 18 }}>
          <Display size={62}>Four beats of the live demo</Display>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          top: 360,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
        }}
      >
        {SCREENS.map(([h, b], i) => (
          <div
            key={h}
            style={{
              ...rise(f, 22 + i * 13),
              background: C.sand,
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              padding: 40,
              minHeight: 220,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: C.champ,
                }}
              >
                {`0${i + 1}`}
              </span>
              <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 40, color: C.ink }}>
                {h}
              </span>
            </div>
            <div style={{ marginTop: 18, fontFamily: sans, fontSize: 25, color: C.inkSoft, lineHeight: 1.3 }}>
              {b}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
