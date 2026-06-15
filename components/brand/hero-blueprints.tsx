import type { ReactNode } from "react";

import { Gear } from "@/components/home/blueprint";

/*
 * Filigranes de masthead Drop No. — un diagramme technique « blueprint » par
 * page, au trait, qui remplit le fond de la bande d'en-tête (Masthead). Tout au
 * trait via currentColor : la couleur (champagne) et l'opacité sont pilotées
 * par le parent. Diagrammes pensés pour le sujet de chaque page :
 *   movement    — calibre (home)
 *   escapement  — échappement + cadence (calendrier des drops)
 *   atelier     — outils d'horloger (maisons)
 *   clearing    — tri des offres + prix unique (mécanisme)
 *   caseSection — coupe d'un boîtier (fiche drop)
 *   exploded    — vue éclatée (à propos)
 *   seal        — guilloché / sceau (documents légaux)
 *
 * Composants serveur, statiques (aucun random : SSR déterministe).
 */

export type HeroBlueprintVariant =
  | "movement"
  | "escapement"
  | "atelier"
  | "clearing"
  | "caseSection"
  | "exploded"
  | "seal";

const MONO = { fontFamily: "ui-monospace, monospace" } as const;

/** Bande SVG plein cadre, ancrée à droite (le motif reste visible au crop). */
function Plate({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 720 440"
      preserveAspectRatio="xMaxYMid slice"
      className="h-full w-full"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// ── Générateurs géométriques (déterministes) ──────────────────────────────

/** Spirale d'Archimède (spiral de balancier / ressort moteur). */
function spiralPath(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  turns: number,
  steps = 140
) {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const ang = f * turns * 2 * Math.PI;
    const rad = r0 + (r1 - r0) * f;
    const x = cx + rad * Math.cos(ang);
    const y = cy + rad * Math.sin(ang);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

/** Roue dentée en tracé continu (skew > 0 = denture d'échappement asymétrique). */
function toothedWheel(
  cx: number,
  cy: number,
  r: number,
  n: number,
  depth: number,
  skew = 0
) {
  const inner = r - depth;
  let d = "";
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI;
    const a1 = ((i + 0.5) / n) * 2 * Math.PI;
    const a2 = ((i + 1) / n) * 2 * Math.PI;
    const p0x = cx + r * Math.cos(a0 + skew);
    const p0y = cy + r * Math.sin(a0 + skew);
    const p1x = cx + inner * Math.cos(a1);
    const p1y = cy + inner * Math.sin(a1);
    const p2x = cx + r * Math.cos(a2 + skew);
    const p2y = cy + r * Math.sin(a2 + skew);
    d +=
      (i === 0 ? `M${p0x.toFixed(1)} ${p0y.toFixed(1)}` : "") +
      `L${p1x.toFixed(1)} ${p1y.toFixed(1)}L${p2x.toFixed(1)} ${p2y.toFixed(1)}`;
  }
  return `${d}Z`;
}

/** Petits cercles répartis sur une jante (vis de balancier, rubis…). */
function ringDots(cx: number, cy: number, r: number, n: number, dotR: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    return (
      <circle
        key={i}
        cx={cx + r * Math.cos(a)}
        cy={cy + r * Math.sin(a)}
        r={dotR}
        strokeWidth={1}
      />
    );
  });
}

/** Repères de graduation radiaux. */
function ringTicks(
  cx: number,
  cy: number,
  r: number,
  n: number,
  len: number,
  sw = 1
) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return (
      <line
        key={i}
        x1={cx + r * c}
        y1={cy + r * s}
        x2={cx + (r - len) * c}
        y2={cy + (r - len) * s}
        strokeWidth={sw}
      />
    );
  });
}

function Label({
  x,
  y,
  children,
  size = 11,
  ls = 2,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  ls?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      style={MONO}
      fontSize={size}
      letterSpacing={ls}
      fill="currentColor"
      stroke="none"
      opacity={0.75}
    >
      {children}
    </text>
  );
}

// ── Variantes ──────────────────────────────────────────────────────────────

/** Calibre : platine, balancier, spiral, rouages, couronne. */
function Movement() {
  const cx = 508;
  const cy = 214;
  return (
    <Plate>
      <g opacity={0.4} strokeWidth={1} strokeDasharray="2 5">
        <line x1={cx} y1={-20} x2={cx} y2={460} />
        <line x1={220} y1={cy} x2={740} y2={cy} />
      </g>
      {/* platine */}
      <circle cx={cx} cy={cy} r={190} strokeWidth={1.3} />
      <circle cx={cx} cy={cy} r={150} strokeWidth={1} opacity={0.55} />
      <g opacity={0.6}>{ringTicks(cx, cy, 150, 60, 8)}</g>
      {/* balancier */}
      <circle cx={cx} cy={cy} r={94} strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={82} strokeWidth={1} opacity={0.7} />
      <g strokeWidth={1.1}>
        <line x1={cx - 82} y1={cy} x2={cx + 82} y2={cy} />
        <line x1={cx} y1={cy - 82} x2={cx} y2={cy + 82} />
        <line x1={cx - 58} y1={cy - 58} x2={cx + 58} y2={cy + 58} />
        <line x1={cx - 58} y1={cy + 58} x2={cx + 58} y2={cy - 58} />
      </g>
      <g opacity={0.85}>{ringDots(cx, cy, 88, 8, 3.4)}</g>
      <path d={spiralPath(cx, cy, 5, 44, 3.4)} strokeWidth={1} opacity={0.8} />
      <circle cx={cx} cy={cy} r={5} strokeWidth={1.2} />
      {/* rouages */}
      <g opacity={0.85}>
        <Gear cx={296} cy={332} r={68} teeth={17} sw={1.2} color="currentColor" />
        <Gear cx={176} cy={150} r={44} teeth={11} sw={1.1} color="currentColor" />
        <Gear cx={646} cy={356} r={30} teeth={9} sw={1.1} color="currentColor" />
      </g>
      {/* couronne + tige */}
      <g strokeWidth={1.2}>
        <line x1={702} y1={cy} x2={730} y2={cy} />
        <rect x={700} y={cy - 13} width={7} height={26} rx={2} />
        <g opacity={0.6}>{ringTicks(728, cy, 14, 10, 5, 1)}</g>
      </g>
      <Label x={300} y={70}>
        CAL. № 001
      </Label>
      <Label x={300} y={86} size={8} ls={1.5}>
        21 600 A/H
      </Label>
    </Plate>
  );
}

/** Échappement + cadence : roue d'ancre, ancre, balancier, axe des 5 jours. */
function Escapement() {
  const ex = 548;
  const ey = 190;
  const r = 116;
  return (
    <Plate>
      {/* roue d'échappement (denture asymétrique) */}
      <circle cx={ex} cy={ey} r={r} strokeWidth={1.2} opacity={0.5} />
      <path d={toothedWheel(ex, ey, r, 18, 22, 0.18)} strokeWidth={1.3} />
      <circle cx={ex} cy={ey} r={r * 0.5} strokeWidth={1} opacity={0.7} />
      <g strokeWidth={1}>
        <line x1={ex - r * 0.5} y1={ey} x2={ex + r * 0.5} y2={ey} />
        <line x1={ex} y1={ey - r * 0.5} x2={ex} y2={ey + r * 0.5} />
      </g>
      <circle cx={ex} cy={ey} r={5} strokeWidth={1.2} />
      {/* ancre */}
      <g strokeWidth={1.3} opacity={0.9}>
        <path d={`M${ex - 150} ${ey + 70} L${ex - 70} ${ey + 8}`} />
        <path d={`M${ex - 150} ${ey + 70} L${ex - 96} ${ey + 120}`} />
        <circle cx={ex - 150} cy={ey + 70} r={7} />
        <rect
          x={ex - 84}
          y={ey - 4}
          width={20}
          height={14}
          rx={2}
          transform={`rotate(-38 ${ex - 74} ${ey + 3})`}
        />
      </g>
      {/* balancier fantôme */}
      <circle cx={ex - 168} cy={ey + 150} r={70} strokeWidth={1} opacity={0.4} />
      <Gear
        cx={ex - 168}
        cy={ey + 150}
        r={70}
        teeth={16}
        sw={1.1}
        color="currentColor"
      />
      {/* axe de cadence : fenêtre de 5 jours -> révélation */}
      <g strokeWidth={1.2}>
        <line x1={40} y1={392} x2={690} y2={392} />
        {Array.from({ length: 6 }, (_, i) => {
          const x = 80 + i * 116;
          const major = i === 0 || i === 5;
          return (
            <line
              key={i}
              x1={x}
              y1={392}
              x2={x}
              y2={major ? 372 : 380}
              strokeWidth={major ? 1.4 : 1}
            />
          );
        })}
        <circle cx={80 + 5 * 116} cy={392} r={5} fill="currentColor" stroke="none" />
      </g>
      <Label x={66} y={416} size={8} ls={1.5}>
        J−5
      </Label>
      <Label x={80 + 5 * 116 - 26} y={416} size={8} ls={1.5}>
        RÉVÉL.
      </Label>
      <Label x={420} y={70}>
        ÉCHAPPEMENT
      </Label>
    </Plate>
  );
}

/** Atelier : loupe, brucelles, tournevis, porte-mouvement, fond gravé. */
function Atelier() {
  return (
    <Plate>
      {/* loupe d'horloger */}
      <g strokeWidth={1.3}>
        <ellipse cx={556} cy={150} rx={70} ry={30} />
        <line x1={486} y1={150} x2={486} y2={196} />
        <line x1={626} y1={150} x2={626} y2={196} />
        <ellipse cx={556} cy={196} rx={70} ry={30} opacity={0.75} />
        <ellipse cx={556} cy={150} rx={44} ry={18} opacity={0.5} />
      </g>
      {/* porte-mouvement (anneau + vis) */}
      <g strokeWidth={1.2} opacity={0.9}>
        <circle cx={326} cy={300} r={96} />
        <circle cx={326} cy={300} r={78} opacity={0.6} />
        <g opacity={0.7}>{ringTicks(326, 300, 78, 36, 6)}</g>
        <circle cx={326} cy={204} r={8} />
        <circle cx={326} cy={300} r={30} opacity={0.7} />
        <g opacity={0.85}>
          <Gear cx={326} cy={300} r={30} teeth={10} sw={1} color="currentColor" />
        </g>
      </g>
      {/* brucelles */}
      <g strokeWidth={1.3} opacity={0.9}>
        <path d="M628 250 L548 320" />
        <path d="M640 258 L556 326" />
        <path d="M628 250 Q636 246 640 258" />
      </g>
      {/* tournevis */}
      <g strokeWidth={1.2} opacity={0.85}>
        <rect x={150} y={120} width={26} height={54} rx={6} />
        <line x1={163} y1={174} x2={163} y2={250} />
        <rect x={159} y={250} width={8} height={14} />
      </g>
      <Label x={150} y={96}>
        ATELIER
      </Label>
      <Label x={470} y={252} size={8} ls={1.5}>
        ×10
      </Label>
    </Plate>
  );
}

/** Mécanisme : tri des offres scellées, ligne de prix unique, rouage. */
function Clearing() {
  const baseline = 326;
  const clearing = 150;
  const w = 40;
  const gap = 54;
  const x0 = 300;
  const bars = [70, 104, 150, 198, 236, 274].map((top, i) => ({
    x: x0 + i * gap,
    top,
    win: i < 4,
  }));
  return (
    <Plate>
      {/* rouage de calcul */}
      <g opacity={0.8}>
        <Gear cx={150} cy={250} r={92} teeth={20} sw={1.2} color="currentColor" />
        <Gear cx={258} cy={150} r={40} teeth={11} sw={1.1} color="currentColor" />
      </g>
      {/* enveloppe scellée */}
      <g strokeWidth={1.2} opacity={0.75}>
        <rect x={300} y={44} width={70} height={48} rx={3} />
        <path d="M300 50 L335 78 L370 50" />
      </g>
      {/* remplissage des gagnantes au prix unique */}
      {bars
        .filter((b) => b.win)
        .map((b, i) => (
          <rect
            key={`f-${i}`}
            x={b.x}
            y={clearing}
            width={w}
            height={baseline - clearing}
            fill="currentColor"
            stroke="none"
            opacity={0.12}
          />
        ))}
      {/* contours des offres */}
      {bars.map((b, i) => (
        <rect
          key={`b-${i}`}
          x={b.x}
          y={b.top}
          width={w}
          height={baseline - b.top}
          strokeWidth={1.3}
        />
      ))}
      <line x1={288} y1={baseline} x2={x0 + 5 * gap + w + 12} y2={baseline} strokeWidth={1.5} />
      {/* ligne de prix unique (N-ième) */}
      <line
        x1={280}
        y1={clearing}
        x2={700}
        y2={clearing}
        strokeWidth={1.3}
        strokeDasharray="4 4"
      />
      <circle
        cx={x0 + 3 * gap + w / 2}
        cy={clearing}
        r={5}
        fill="currentColor"
        stroke="none"
      />
      <Label x={668} y={clearing - 8}>
        Nᵉ
      </Label>
      <Label x={300} y={416} size={8} ls={1.5}>
        OFFRES TRIÉES → PRIX UNIQUE
      </Label>
    </Plate>
  );
}

/** Coupe de boîtier : verre, lunette, cadran, mouvement, fond, cornes. */
function CaseSection() {
  const cx = 470;
  return (
    <Plate>
      {/* cotation hauteur */}
      <g strokeWidth={1} opacity={0.55}>
        <line x1={250} y1={150} x2={250} y2={300} />
        <line x1={244} y1={150} x2={256} y2={150} />
        <line x1={244} y1={300} x2={256} y2={300} />
      </g>
      <g strokeWidth={1.3}>
        {/* verre bombé */}
        <path d={`M${cx - 150} 168 Q${cx} 120 ${cx + 150} 168`} />
        {/* lunette */}
        <path d={`M${cx - 178} 168 L${cx - 150} 168`} />
        <path d={`M${cx + 150} 168 L${cx + 178} 168`} />
        {/* cadran */}
        <line x1={cx - 168} y1={184} x2={cx + 168} y2={184} opacity={0.7} />
        {/* carrure */}
        <path
          d={`M${cx - 178} 168 L${cx - 188} 262 Q${cx - 188} 300 ${cx - 150} 300 L${cx + 150} 300 Q${cx + 188} 300 ${cx + 188} 262 L${cx + 178} 168`}
        />
        {/* fond */}
        <path d={`M${cx - 150} 300 Q${cx} 322 ${cx + 150} 300`} opacity={0.85} />
      </g>
      {/* mouvement (rouages en coupe) */}
      <g opacity={0.8}>
        <Gear cx={cx - 60} cy={232} r={34} teeth={10} sw={1} color="currentColor" />
        <Gear cx={cx + 24} cy={244} r={26} teeth={9} sw={1} color="currentColor" />
        <Gear cx={cx + 96} cy={230} r={20} teeth={8} sw={1} color="currentColor" />
      </g>
      {/* cornes */}
      <g strokeWidth={1.2} opacity={0.8}>
        <path d={`M${cx - 184} 230 L${cx - 232} 250`} />
        <path d={`M${cx + 184} 230 L${cx + 232} 250`} />
      </g>
      {/* couronne */}
      <rect x={cx + 188} y={220} width={20} height={16} rx={3} strokeWidth={1.2} />
      {/* lignes de repère + labels */}
      <g strokeWidth={0.8} opacity={0.55} strokeDasharray="2 3">
        <line x1={cx + 150} y1={150} x2={640} y2={150} />
        <line x1={cx + 168} y1={184} x2={640} y2={184} />
        <line x1={cx + 110} y1={232} x2={640} y2={232} />
        <line x1={cx + 150} y1={300} x2={640} y2={300} />
      </g>
      <Label x={648} y={154} size={8} ls={1.5}>
        VERRE
      </Label>
      <Label x={648} y={188} size={8} ls={1.5}>
        CADRAN
      </Label>
      <Label x={648} y={236} size={8} ls={1.5}>
        MOUVEMENT
      </Label>
      <Label x={648} y={304} size={8} ls={1.5}>
        FOND
      </Label>
      <Label x={222} y={150} size={9}>
        ⌀
      </Label>
    </Plate>
  );
}

/** Vue éclatée : composants empilés sur un axe vertical. */
function Exploded() {
  const ax = 528;
  const parts: { y: number; rx: number; ry: number; label: string }[] = [
    { y: 70, rx: 120, ry: 26, label: "VERRE" },
    { y: 130, rx: 132, ry: 30, label: "LUNETTE" },
    { y: 196, rx: 124, ry: 28, label: "CADRAN" },
    { y: 326, rx: 120, ry: 28, label: "BOÎTIER" },
    { y: 388, rx: 110, ry: 26, label: "FOND" },
  ];
  return (
    <Plate>
      {/* axe d'assemblage */}
      <line
        x1={ax}
        y1={36}
        x2={ax}
        y2={418}
        strokeWidth={1}
        opacity={0.5}
        strokeDasharray="3 5"
      />
      {parts.map((p, i) => (
        <g key={i}>
          <ellipse cx={ax} cy={p.y} rx={p.rx} ry={p.ry} strokeWidth={1.3} />
          <ellipse
            cx={ax}
            cy={p.y}
            rx={p.rx * 0.6}
            ry={p.ry * 0.6}
            strokeWidth={1}
            opacity={0.5}
          />
          <line
            x1={ax + p.rx}
            y1={p.y}
            x2={690}
            y2={p.y}
            strokeWidth={0.8}
            opacity={0.5}
            strokeDasharray="2 3"
          />
          <text
            x={696}
            y={p.y + 3}
            style={MONO}
            fontSize={8}
            letterSpacing={1.5}
            fill="currentColor"
            stroke="none"
            opacity={0.7}
          >
            {String(i + 1).padStart(2, "0")} {p.label}
          </text>
        </g>
      ))}
      {/* mouvement au centre de l'éclaté */}
      <g opacity={0.85}>
        <Gear cx={ax} cy={262} r={56} teeth={15} sw={1.2} color="currentColor" />
        <Gear cx={ax - 78} cy={262} r={28} teeth={9} sw={1} color="currentColor" />
      </g>
      <line
        x1={ax + 56}
        y1={262}
        x2={690}
        y2={262}
        strokeWidth={0.8}
        opacity={0.5}
        strokeDasharray="2 3"
      />
      <text
        x={696}
        y={265}
        style={MONO}
        fontSize={8}
        letterSpacing={1.5}
        fill="currentColor"
        stroke="none"
        opacity={0.7}
      >
        MOUVEMENT
      </text>
      <Label x={120} y={70}>
        VUE ÉCLATÉE
      </Label>
    </Plate>
  );
}

/** Sceau : rosace guillochée + cercles concentriques (authenticité, documents). */
function Seal() {
  const cx = 540;
  const cy = 220;
  const petals = 36;
  return (
    <Plate>
      <circle cx={cx} cy={cy} r={170} strokeWidth={1} opacity={0.5} />
      <circle cx={cx} cy={cy} r={150} strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={92} strokeWidth={1} opacity={0.7} />
      {/* rosace guillochée : ellipses pivotées */}
      <g opacity={0.7} strokeWidth={0.8}>
        {Array.from({ length: petals }, (_, i) => {
          const a = (i / petals) * 180;
          return (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={150}
              ry={54}
              transform={`rotate(${a} ${cx} ${cy})`}
            />
          );
        })}
      </g>
      <g opacity={0.6}>{ringTicks(cx, cy, 150, 72, 6)}</g>
      <circle cx={cx} cy={cy} r={30} strokeWidth={1.2} />
      <text
        x={cx}
        y={cy + 6}
        textAnchor="middle"
        style={MONO}
        fontSize={18}
        letterSpacing={1}
        fill="currentColor"
        stroke="none"
        opacity={0.8}
      >
        №
      </text>
      <Label x={120} y={84}>
        DOCUMENTS
      </Label>
      <Label x={120} y={100} size={8} ls={1.5}>
        SCELLÉ · AUTHENTIQUE
      </Label>
    </Plate>
  );
}

const VARIANTS: Record<HeroBlueprintVariant, () => ReactNode> = {
  movement: Movement,
  escapement: Escapement,
  atelier: Atelier,
  clearing: Clearing,
  caseSection: CaseSection,
  exploded: Exploded,
  seal: Seal,
};

export function HeroBlueprint({ variant }: { variant: HeroBlueprintVariant }) {
  const Variant = VARIANTS[variant];
  return <Variant />;
}
