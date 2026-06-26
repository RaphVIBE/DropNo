import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { C, serif, sans } from "../theme";
import { BrowserFrame, SiteNav, Cursor, ClickRipple } from "./chrome";

const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ip = (f: number, a: number[], b: number[]) =>
  interpolate(f, a, b, { ...clamp, easing: OUT });

// ---- watch product tile (suggested dial, not a photo) ----
const WatchTile: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div style={{ width: w, height: h, borderRadius: 14, background: "#171310", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 90% at 30% 20%, rgba(184,144,88,0.18), rgba(0,0,0,0) 60%)" }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", width: Math.min(w, h) * 0.5, height: Math.min(w, h) * 0.5, transform: "translate(-50%,-50%)", borderRadius: 99, border: "2px solid rgba(207,199,182,0.5)" }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 4, height: Math.min(w, h) * 0.16, transform: "translate(-50%,-100%)", background: "rgba(207,199,182,0.7)" }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", width: Math.min(w, h) * 0.12, height: 4, transform: "translate(-2px,-50%) rotate(0deg)", transformOrigin: "left", background: "rgba(207,199,182,0.7)" }} />
  </div>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontFamily: sans, fontSize: 14, letterSpacing: 2, color: C.muted }}>{label}</div>
    <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 40, color: C.ink, marginTop: 6 }}>{value}</div>
  </div>
);

// ============================ HOME ============================
const Home: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", inset: 0, background: C.bg }}>
    <SiteNav />
    <div style={{ display: "flex", gap: 60, padding: "150px 60px 0" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 18, letterSpacing: 3, color: C.muted, opacity: ip(f, [10, 28], [0, 1]) }}>
          DROP № 003 · OFFRE SCELLÉE
        </div>
        <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 96, color: C.ink, lineHeight: 1, marginTop: 18, opacity: ip(f, [20, 40], [0, 1]) }}>
          Plongeur
          <br />
          Bronze
        </div>
        <div style={{ fontFamily: sans, fontSize: 20, letterSpacing: 2, color: C.inkSoft, marginTop: 24, opacity: ip(f, [32, 50], [0, 1]) }}>
          MAISON LÉVRIER
        </div>
        {/* bouton "Voir le drop" — cible du curseur (centre ~165,569) */}
        <div style={{ position: "absolute", left: 60, top: 540, width: 210, height: 58, background: C.ink, color: C.bg, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontSize: 15, letterSpacing: 1.5, opacity: ip(f, [44, 62], [0, 1]) }}>
          VOIR LE DROP
        </div>
      </div>
      <div style={{ flex: "0 0 720px", opacity: ip(f, [16, 40], [0, 1]) }}>
        <WatchTile w={720} h={560} />
      </div>
    </div>
  </div>
);

// ============================ DROP ============================
const Drop: React.FC<{ f: number }> = ({ f }) => {
  const sealed = f >= 380;
  // saisie progressive de "8 600"
  const full = "8 600";
  const frac = interpolate(f, [235, 300], [0, 1], clamp);
  const typed = full.slice(0, Math.round(frac * full.length));
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg }}>
      <SiteNav />
      <div style={{ display: "flex", gap: 56, padding: "120px 60px 0" }}>
        <div style={{ flex: "0 0 820px" }}>
          <WatchTile w={820} h={600} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 30, color: C.ink }}>Drop No. 003</span>
            <span style={{ border: `1px solid ${C.champ}`, color: C.champDk, borderRadius: 99, padding: "7px 16px", fontFamily: sans, fontSize: 14, letterSpacing: 2 }}>
              OUVERT · CLÔTURE JEUDI 18H
            </span>
          </div>
          <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 64, color: C.ink, marginTop: 14 }}>Plongeur Bronze</div>
          <div style={{ display: "flex", gap: 90, marginTop: 30 }}>
            <Stat label="PRIX PLANCHER" value="5 800 €" />
            <Stat label="EXEMPLAIRES" value="3" />
          </div>

          {/* panneau d'offre — coords absolues pour aligner le curseur */}
          <div style={{ marginTop: 34, border: `1px solid ${C.line}`, background: C.card, borderRadius: 4, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: sans, fontSize: 14, letterSpacing: 2, color: C.muted }}>
              <span>VOTRE OFFRE SCELLÉE</span>
              <span style={{ fontFamily: serif, fontStyle: "italic", color: C.inkSoft }}>3 offres soumises</span>
            </div>
            {sealed ? (
              <>
                <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 40, color: C.ink, marginTop: 20 }}>
                  Offre scellée : 8 600 €
                </div>
                <div style={{ fontFamily: sans, fontSize: 16, color: C.inkSoft, marginTop: 12 }}>
                  Modifiable jusqu’à une heure avant la révélation. Résultat par email.
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, borderBottom: `2px solid ${C.ink}`, paddingBottom: 12, marginTop: 18 }}>
                  <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 56, color: typed ? C.ink : C.line, lineHeight: 1 }}>
                    {typed || "5 800"}
                  </span>
                  <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 44, color: C.muted, marginLeft: "auto" }}>€</span>
                </div>
                <div style={{ marginTop: 22, height: 56, background: C.ink, color: C.bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontSize: 15, letterSpacing: 2 }}>
                  SCELLER MON OFFRE
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================ TIME-JUMP ============================
const TimeJump: React.FC<{ f: number }> = ({ f }) => {
  const sec = Math.max(0, 3 - Math.floor((f - 486) / 15));
  return (
    <AbsoluteFill style={{ background: C.ink, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: sans, fontSize: 22, letterSpacing: 6, color: C.champ, opacity: ip(f, [470, 488], [0, 1]) }}>
        JEUDI · 18:00
      </div>
      <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 150, color: C.bg, marginTop: 18, opacity: ip(f, [474, 492], [0, 1]) }}>
        {`00:0${sec}`}
      </div>
      <div style={{ fontFamily: sans, fontSize: 24, color: C.paper, marginTop: 14, opacity: ip(f, [480, 498], [0, 1]) }}>
        La révélation commence.
      </div>
    </AbsoluteFill>
  );
};

// ============================ REVEAL ============================
const Reveal: React.FC<{ f: number }> = ({ f }) => {
  const sweep = ip(f, [566, 596], [0, 100]);
  return (
    <AbsoluteFill style={{ background: C.ink, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: sans, fontSize: 22, letterSpacing: 6, color: C.champ, opacity: ip(f, [548, 566], [0, 1]) }}>
        RÉVÉLATION · DROP № 003
      </div>
      <div style={{ fontFamily: sans, fontSize: 20, letterSpacing: 3, color: C.paper, marginTop: 30, opacity: ip(f, [556, 574], [0, 1]) }}>
        PRIX UNIQUE
      </div>
      <div style={{ position: "relative", marginTop: 6 }}>
        <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 180, color: C.bg, lineHeight: 1, ...{ opacity: ip(f, [560, 584], [0, 1]) }, transform: `translateY(${ip(f, [560, 588], [26, 0])}px)` }}>
          8 000 €
        </div>
        <div style={{ height: 4, background: C.champ, width: `${sweep}%`, marginTop: 6 }} />
      </div>
      <div style={{ fontFamily: sans, fontSize: 26, color: C.paper, marginTop: 34, opacity: ip(f, [596, 616], [0, 1]) }}>
        3 gagnants · tous au même prix · vous l’emportez.
      </div>
    </AbsoluteFill>
  );
};

// ============================ ORCHESTRATION ============================
export const Walkthrough: React.FC = () => {
  const f = useCurrentFrame();

  const homeOp = ip(f, [0, 1, 140, 162], [1, 1, 1, 0]);
  const dropOp = Math.min(ip(f, [146, 166], [0, 1]), ip(f, [466, 486], [1, 0]));
  const jumpOp = Math.min(ip(f, [468, 486], [0, 1]), ip(f, [534, 552], [1, 0]));
  const revealOp = ip(f, [540, 562], [0, 1]);

  // curseur (coords dans l'espace contenu du navigateur)
  const cx = ip(f, [0, 90, 150, 210, 300, 345], [1300, 165, 700, 1300, 1300, 1300]);
  const cy = ip(f, [0, 90, 150, 210, 300, 345], [840, 569, 540, 590, 590, 720]);
  const curOp = ip(f, [0, 12, 452, 468], [0, 1, 1, 0]);

  return (
    <AbsoluteFill style={{ background: "#E9E3D6" }}>
      <BrowserFrame>
        {homeOp > 0 ? <div style={{ position: "absolute", inset: 0, opacity: homeOp }}><Home f={f} /></div> : null}
        {dropOp > 0 ? <div style={{ position: "absolute", inset: 0, opacity: dropOp }}><Drop f={f} /></div> : null}
        {/* curseur + clics au-dessus des vues */}
        <Cursor x={cx} y={cy} opacity={curOp} />
        <ClickRipple x={165} y={569} frame={f} at={110} />
        <ClickRipple x={1300} y={590} frame={f} at={225} />
        <ClickRipple x={1300} y={720} frame={f} at={365} />
      </BrowserFrame>
      {jumpOp > 0 ? <AbsoluteFill style={{ opacity: jumpOp }}><TimeJump f={f} /></AbsoluteFill> : null}
      {revealOp > 0 ? <AbsoluteFill style={{ opacity: revealOp }}><Reveal f={f} /></AbsoluteFill> : null}
    </AbsoluteFill>
  );
};

export const WALKTHROUGH_FRAMES = 720; // 24 s @ 30 fps
