import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, serif, sans } from "../theme";
import { SceneHeader, GoldTick, Display, Chevron } from "../components/ui";
import { rise } from "../anim";

const STEPS: [string, string][] = [
  ["Idea", "a hunch"],
  ["Explore", "Claude + Mistral"],
  ["Decide", "an approach"],
  ["PRD", "source of truth"],
  ["Two tracks", "Lovable + system"],
  ["Outside-in", "slice it"],
  ["Real MVP", "shipped"],
];

export const Loop: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <SceneHeader index="THE LOOP" />
      <div style={{ position: "absolute", left: 96, top: 150 }}>
        <div style={rise(f, 4)}>
          <GoldTick />
        </div>
        <div style={{ ...rise(f, 8), marginTop: 18 }}>
          <Display size={62}>How an idea becomes an MVP</Display>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          top: 430,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {STEPS.map(([a, b], i) => {
          const start = 26 + i * 12;
          const dark = i === 0 || i === STEPS.length - 1;
          return (
            <React.Fragment key={a}>
              <div
                style={{
                  ...rise(f, start),
                  width: 218,
                  height: 232,
                  borderRadius: 14,
                  background: dark ? C.ink : C.card,
                  border: dark ? "none" : `1px solid ${C.line}`,
                  padding: 24,
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    fontFamily: sans,
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: C.champ,
                  }}
                >
                  {`0${i + 1}`}
                </div>
                <div
                  style={{
                    marginTop: 18,
                    fontFamily: serif,
                    fontStyle: "italic",
                    fontSize: 30,
                    color: dark ? C.bg : C.ink,
                  }}
                >
                  {a}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontFamily: sans,
                    fontSize: 19,
                    color: dark ? C.paper : C.muted,
                  }}
                >
                  {b}
                </div>
              </div>
              {i < STEPS.length - 1 ? (
                <div style={{ opacity: rise(f, start + 6).opacity }}>
                  <Chevron size={28} />
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      <div
        style={{
          ...rise(f, 26 + STEPS.length * 12),
          position: "absolute",
          left: 96,
          right: 96,
          top: 760,
          fontFamily: sans,
          fontSize: 26,
          color: C.inkSoft,
        }}
      >
        The two middle moves run in parallel: a clickable prototype (outside-in)
        and a design system, both feeding the same build.
      </div>
    </AbsoluteFill>
  );
};
