import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, serif, sans } from "../theme";
import { GoldTick } from "../components/ui";
import { rise, fade } from "../anim";

export const Title: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.ink, padding: 96, justifyContent: "center" }}>
      <div style={{ ...rise(f, 6), opacity: fade(f, 6) }}>
        <GoldTick width={88} />
      </div>
      <div
        style={{
          ...rise(f, 12),
          marginTop: 22,
          fontFamily: sans,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 5,
          color: C.champ,
        }}
      >
        DROP NO. · A FIELD NOTE
      </div>
      <div
        style={{
          ...rise(f, 20, 22, 34),
          marginTop: 26,
          fontFamily: serif,
          fontStyle: "italic",
          fontSize: 112,
          lineHeight: 0.98,
          color: C.bg,
        }}
      >
        Building a real
        <br />
        product with AI
      </div>
      <div
        style={{
          ...rise(f, 40),
          marginTop: 40,
          maxWidth: 1180,
          fontFamily: sans,
          fontSize: 32,
          lineHeight: 1.35,
          color: C.paper,
        }}
      >
        From a one-line idea to a working MVP — the workflow, the tools, and what
        actually changed.
      </div>
    </AbsoluteFill>
  );
};
