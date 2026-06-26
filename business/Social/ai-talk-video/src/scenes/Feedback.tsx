import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, serif, sans } from "../theme";
import { SceneHeader, GoldTick, Display, Chevron } from "../components/ui";
import { rise } from "../anim";

const ROWS: [string, string][] = [
  ["“The closed drop feels too admin.”", "Result panel: unit price up front + a warm nudge to the calendar."],
  ["“‘Calendar’ is clearer than ‘Drops’.”", "Nav relabelled, FR/EN, route untouched."],
  ["“Hide empty ‘Live’; lead with ‘Upcoming’.”", "Calendar reorders itself when nothing is open."],
  ["“Partial sale, not all-or-nothing.”", "DB migration + close logic + form toggle + tests."],
];

export const Feedback: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <SceneHeader index="THE LOOP, LIVE" />
      <div style={{ position: "absolute", left: 96, top: 150 }}>
        <div style={rise(f, 4)}>
          <GoldTick />
        </div>
        <div style={{ ...rise(f, 8), marginTop: 18 }}>
          <Display size={60}>Design feedback becomes shipped code</Display>
        </div>
      </div>
      <div style={{ position: "absolute", left: 96, right: 96, top: 360 }}>
        {ROWS.map(([q, a], i) => {
          const start = 22 + i * 14;
          return (
            <div
              key={i}
              style={{
                ...rise(f, start),
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "26px 0",
                borderBottom: i < ROWS.length - 1 ? `1px solid ${C.line}` : "none",
              }}
            >
              <div
                style={{
                  flex: "0 0 720px",
                  fontFamily: serif,
                  fontStyle: "italic",
                  fontSize: 30,
                  color: C.ink,
                }}
              >
                {q}
              </div>
              <Chevron size={26} />
              <div style={{ flex: 1, fontFamily: sans, fontSize: 26, color: C.inkSoft }}>
                {a}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
