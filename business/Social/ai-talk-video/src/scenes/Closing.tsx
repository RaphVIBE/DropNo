import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, serif, sans } from "../theme";
import { GoldTick } from "../components/ui";
import { rise } from "../anim";

export const Closing: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.ink, padding: 96, justifyContent: "center" }}>
      <div style={rise(f, 6)}>
        <GoldTick width={88} />
      </div>
      <div
        style={{
          ...rise(f, 12, 22, 34),
          marginTop: 26,
          fontFamily: serif,
          fontStyle: "italic",
          fontSize: 104,
          color: C.bg,
        }}
      >
        Idea to MVP,
        <br />
        the same week.
      </div>
      <div
        style={{
          ...rise(f, 32),
          marginTop: 36,
          fontFamily: sans,
          fontSize: 30,
          color: C.paper,
        }}
      >
        The tools do the plumbing. Taste, strategy and the brand stay human.
      </div>
      <div
        style={{
          ...rise(f, 46),
          marginTop: 60,
          fontFamily: sans,
          fontSize: 24,
          color: C.muted,
        }}
      >
        Raphaël Hombroeck · raph@dropno.eu · dropno.eu
      </div>
    </AbsoluteFill>
  );
};
