import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, serif, sans } from "../theme";
import { SceneHeader, GoldTick, Display } from "../components/ui";
import { rise } from "../anim";

const TOOLS: [string, string, string][] = [
  ["Skills", "Packaged expertise on tap.", "design audits, deck & PDF builders"],
  ["Agents", "Delegate a whole multi-step job — in parallel.", "explore the codebase, then report back"],
  ["MCPs", "Live connections to real tools.", "the Supabase database, Drive, the browser"],
  ["Schedulers", "Set-and-forget recurring tasks.", "a morning brief, a weekly digest"],
];

export const Toolbox: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <SceneHeader index="THE TOOLBOX" />
      <div style={{ position: "absolute", left: 96, top: 150 }}>
        <div style={rise(f, 4)}>
          <GoldTick />
        </div>
        <div style={{ ...rise(f, 8), marginTop: 18 }}>
          <Display size={62}>Four things worth knowing</Display>
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
        {TOOLS.map(([h, b, ex], i) => (
          <div
            key={h}
            style={{
              ...rise(f, 22 + i * 12),
              background: C.card,
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              padding: 40,
              minHeight: 230,
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
                marginTop: 12,
                fontFamily: serif,
                fontStyle: "italic",
                fontSize: 40,
                color: C.ink,
              }}
            >
              {h}
            </div>
            <div style={{ marginTop: 16, fontFamily: sans, fontSize: 25, color: C.inkSoft }}>
              {b}
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: serif,
                fontStyle: "italic",
                fontSize: 22,
                color: C.champDk,
              }}
            >
              {ex}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
