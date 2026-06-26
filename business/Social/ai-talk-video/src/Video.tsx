import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { C } from "./theme";
import { Title } from "./scenes/Title";
import { Loop } from "./scenes/Loop";
import { Toolbox } from "./scenes/Toolbox";
import { Feedback } from "./scenes/Feedback";
import { Demo } from "./scenes/Demo";
import { Closing } from "./scenes/Closing";

// Durées par scène (frames @ 30 fps). Total = 1860 = 62 s.
export const SCENES = [
  { C: Title, d: 120 },
  { C: Loop, d: 360 },
  { C: Toolbox, d: 300 },
  { C: Feedback, d: 390 },
  { C: Demo, d: 480 },
  { C: Closing, d: 210 },
] as const;

export const TOTAL = SCENES.reduce((n, s) => n + s.d, 0);

export const Video: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {SCENES.map((s, i) => {
        const Comp = s.C;
        const seq = (
          <Sequence key={i} from={from} durationInFrames={s.d}>
            <Comp />
          </Sequence>
        );
        from += s.d;
        return seq;
      })}
    </AbsoluteFill>
  );
};
