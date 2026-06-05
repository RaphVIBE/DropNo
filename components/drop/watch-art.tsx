/**
 * Illustration SVG de montre (placeholder editorial, 100% local — aucune
 * dependance reseau ni image binaire). La palette est choisie de facon
 * deterministe a partir d'un seed (le drop_number), pour que chaque piece
 * ait un visuel distinct mais coherent avec la charte champagne/ink.
 *
 * Sert de fallback partout ou hero_image_url est absent : detail produit,
 * vignettes du calendrier, visuel d'accueil.
 */

type Palette = {
  bg: [string, string]; // fond editorial (degrade)
  glow: string; // halo radial discret
  caseMetal: string;
  caseEdge: string;
  bezel: string;
  dial: string;
  dialEdge: string;
  accent: string; // trotteuse / cabochon
  hands: string;
  strap: string;
  strapEdge: string;
  subdial?: boolean;
  date?: boolean;
};

const PALETTES: Palette[] = [
  // Cadran champagne, boitier or
  {
    bg: ["oklch(0.30 0.02 70)", "oklch(0.16 0.012 60)"],
    glow: "oklch(0.78 0.06 82)",
    caseMetal: "oklch(0.80 0.08 82)",
    caseEdge: "oklch(0.62 0.07 80)",
    bezel: "oklch(0.72 0.08 82)",
    dial: "oklch(0.86 0.05 86)",
    dialEdge: "oklch(0.70 0.06 84)",
    accent: "oklch(0.55 0.10 40)",
    hands: "oklch(0.32 0.03 70)",
    strap: "oklch(0.40 0.05 50)",
    strapEdge: "oklch(0.28 0.04 50)",
    date: true,
  },
  // Cadran noir, boitier acier
  {
    bg: ["oklch(0.28 0.012 60)", "oklch(0.14 0.01 60)"],
    glow: "oklch(0.70 0.02 80)",
    caseMetal: "oklch(0.74 0.006 80)",
    caseEdge: "oklch(0.54 0.006 80)",
    bezel: "oklch(0.66 0.006 80)",
    dial: "oklch(0.24 0.008 60)",
    dialEdge: "oklch(0.14 0.006 60)",
    accent: "oklch(0.72 0.07 80)",
    hands: "oklch(0.92 0.005 80)",
    strap: "oklch(0.30 0.008 60)",
    strapEdge: "oklch(0.18 0.006 60)",
    subdial: true,
  },
  // Cadran vert anglais, boitier or
  {
    bg: ["oklch(0.28 0.03 150)", "oklch(0.15 0.02 150)"],
    glow: "oklch(0.74 0.06 130)",
    caseMetal: "oklch(0.80 0.08 84)",
    caseEdge: "oklch(0.62 0.07 82)",
    bezel: "oklch(0.72 0.08 84)",
    dial: "oklch(0.42 0.07 150)",
    dialEdge: "oklch(0.28 0.06 150)",
    accent: "oklch(0.84 0.06 86)",
    hands: "oklch(0.90 0.04 86)",
    strap: "oklch(0.34 0.05 150)",
    strapEdge: "oklch(0.22 0.04 150)",
    date: true,
  },
  // Cadran bleu, boitier acier
  {
    bg: ["oklch(0.28 0.03 250)", "oklch(0.14 0.02 250)"],
    glow: "oklch(0.66 0.08 250)",
    caseMetal: "oklch(0.76 0.006 80)",
    caseEdge: "oklch(0.56 0.006 80)",
    bezel: "oklch(0.68 0.006 80)",
    dial: "oklch(0.42 0.10 250)",
    dialEdge: "oklch(0.28 0.08 250)",
    accent: "oklch(0.80 0.10 70)",
    hands: "oklch(0.94 0.02 250)",
    strap: "oklch(0.34 0.06 250)",
    strapEdge: "oklch(0.22 0.05 250)",
    subdial: true,
  },
  // Cadran argent / blanc, boitier acier
  {
    bg: ["oklch(0.30 0.012 60)", "oklch(0.16 0.01 60)"],
    glow: "oklch(0.82 0.02 80)",
    caseMetal: "oklch(0.78 0.006 80)",
    caseEdge: "oklch(0.58 0.006 80)",
    bezel: "oklch(0.70 0.006 80)",
    dial: "oklch(0.90 0.006 90)",
    dialEdge: "oklch(0.74 0.006 90)",
    accent: "oklch(0.55 0.12 25)",
    hands: "oklch(0.30 0.01 70)",
    strap: "oklch(0.72 0.006 80)",
    strapEdge: "oklch(0.54 0.006 80)",
    date: true,
  },
  // Cadran chocolat, boitier or rose
  {
    bg: ["oklch(0.30 0.025 50)", "oklch(0.16 0.015 50)"],
    glow: "oklch(0.76 0.06 50)",
    caseMetal: "oklch(0.78 0.07 50)",
    caseEdge: "oklch(0.60 0.06 48)",
    bezel: "oklch(0.70 0.07 50)",
    dial: "oklch(0.40 0.05 50)",
    dialEdge: "oklch(0.26 0.04 50)",
    accent: "oklch(0.82 0.06 60)",
    hands: "oklch(0.90 0.04 60)",
    strap: "oklch(0.34 0.04 50)",
    strapEdge: "oklch(0.22 0.03 50)",
    subdial: true,
  },
];

const C = { x: 200, y: 250 }; // centre du boitier dans le viewBox 400x500
const CASE_R = 98;
const DIAL_R = 80;

// 12 index horaires, repartis sur le cercle (12 = plus epais).
function indices(palette: Palette) {
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const angle = ((i * 30 - 90) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rIn = 60;
    const rOut = 72;
    const major = i % 3 === 0;
    ticks.push(
      <line
        key={i}
        x1={C.x + cos * rIn}
        y1={C.y + sin * rIn}
        x2={C.x + cos * rOut}
        y2={C.y + sin * rOut}
        stroke={palette.accent}
        strokeWidth={major ? 5 : 2.5}
        strokeLinecap="round"
        opacity={major ? 0.95 : 0.7}
      />
    );
  }
  return ticks;
}

// Endpoint d'une aiguille a partir d'un angle horloger (sens horaire depuis 12h).
function hand(clockDeg: number, len: number) {
  const a = (clockDeg * Math.PI) / 180;
  return { x: C.x + Math.sin(a) * len, y: C.y - Math.cos(a) * len };
}

export function WatchArt({
  seed = 0,
  className,
}: {
  seed?: number;
  className?: string;
}) {
  const palette = PALETTES[((seed % PALETTES.length) + PALETTES.length) % PALETTES.length];
  const uid = `wa${seed}`;

  // Heure "10:10" classique des photos d'horlogerie.
  const hHour = hand(305, 42);
  const hMin = hand(60, 60);
  const hSec = hand(180, 66);
  const hSecTail = hand(0, 16);

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      width="100%"
      height="100%"
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={palette.bg[0]} />
          <stop offset="1" stopColor={palette.bg[1]} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.38" cy="0.34" r="0.55">
          <stop offset="0" stopColor={palette.glow} stopOpacity="0.5" />
          <stop offset="1" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-case`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette.caseMetal} />
          <stop offset="1" stopColor={palette.caseEdge} />
        </linearGradient>
        <radialGradient id={`${uid}-dial`} cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor={palette.dial} />
          <stop offset="1" stopColor={palette.dialEdge} />
        </radialGradient>
      </defs>

      {/* Fond editorial */}
      <rect width="400" height="500" fill={`url(#${uid}-bg)`} />
      <rect width="400" height="500" fill={`url(#${uid}-glow)`} />

      {/* Bracelet (haut + bas) */}
      <g fill={palette.strap} stroke={palette.strapEdge} strokeWidth="2">
        <path d="M150 0 h100 v175 q0 22 -50 22 q-50 0 -50 -22 Z" />
        <path d="M150 500 h100 v-175 q0 -22 -50 -22 q-50 0 -50 22 Z" />
      </g>

      {/* Couronne */}
      <rect
        x={C.x + CASE_R - 2}
        y={C.y - 9}
        width="16"
        height="18"
        rx="3"
        fill={palette.caseEdge}
      />

      {/* Boitier + lunette + cadran */}
      <circle cx={C.x} cy={C.y} r={CASE_R} fill={`url(#${uid}-case)`} />
      <circle
        cx={C.x}
        cy={C.y}
        r={CASE_R - 6}
        fill="none"
        stroke={palette.bezel}
        strokeWidth="10"
      />
      <circle cx={C.x} cy={C.y} r={DIAL_R} fill={`url(#${uid}-dial)`} />

      {/* Index horaires */}
      {indices(palette)}

      {/* Guichet de date (3h) */}
      {palette.date ? (
        <g>
          <rect
            x={C.x + 40}
            y={C.y - 9}
            width="18"
            height="18"
            rx="2"
            fill="oklch(0.96 0.004 90)"
            stroke={palette.dialEdge}
            strokeWidth="1.5"
          />
          <text
            x={C.x + 49}
            y={C.y + 4}
            textAnchor="middle"
            fontSize="12"
            fontFamily="ui-sans-serif, system-ui"
            fill="oklch(0.2 0.01 60)"
          >
            7
          </text>
        </g>
      ) : null}

      {/* Compteur (6h) */}
      {palette.subdial ? (
        <circle
          cx={C.x}
          cy={C.y + 38}
          r="18"
          fill="none"
          stroke={palette.accent}
          strokeWidth="1.5"
          opacity="0.6"
        />
      ) : null}

      {/* Aiguilles */}
      <line
        x1={C.x}
        y1={C.y}
        x2={hHour.x}
        y2={hHour.y}
        stroke={palette.hands}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <line
        x1={C.x}
        y1={C.y}
        x2={hMin.x}
        y2={hMin.y}
        stroke={palette.hands}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1={hSecTail.x}
        y1={hSecTail.y}
        x2={hSec.x}
        y2={hSec.y}
        stroke={palette.accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx={C.x} cy={C.y} r="6" fill={palette.accent} />
    </svg>
  );
}
