/*
 * Primitives « blueprint » Drop No. : engrenages, repères d'angle et trois
 * planches techniques agrandies (offre scellée -> révélation -> prix unique).
 * Tout au trait, fond transparent, palette ink + champagne. Composants serveur.
 */

export const INK = "var(--foreground)";
export const INK_SOFT = "var(--ink-2)";
export const CHAMP = "var(--champagne-deep)";
export const CHAMP_FILL = "var(--champagne)";

type GearProps = {
  cx: number;
  cy: number;
  r: number;
  teeth?: number;
  sw?: number;
  color?: string;
  hole?: number;
  spin?: boolean;
  reverse?: boolean;
  opacity?: number;
};

/** Engrenage stylisé (dents = petits rectangles répartis sur le cercle). */
export function Gear({
  cx,
  cy,
  r,
  teeth = 9,
  sw = 1.3,
  color = INK,
  hole = 0.42,
  spin,
  reverse,
  opacity = 1,
}: GearProps) {
  const tH = r * 0.3;
  const tW = r * 0.3;
  const spinClass = spin
    ? reverse
      ? "cog cog-spin-rev"
      : "cog cog-spin"
    : undefined;
  return (
    <g className={spinClass} opacity={opacity}>
      {Array.from({ length: teeth }).map((_, i) => {
        const a = (360 / teeth) * i;
        return (
          <rect
            key={i}
            x={cx - tW / 2}
            y={cy - r - tH * 0.55}
            width={tW}
            height={tH}
            rx={1}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            transform={`rotate(${a} ${cx} ${cy})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r * hole} fill="none" stroke={color} strokeWidth={sw} />
      <line x1={cx} y1={cy - r * hole} x2={cx} y2={cy - r} stroke={color} strokeWidth={sw * 0.6} opacity={0.5} />
      <line x1={cx - r} y1={cy} x2={cx - r * hole} y2={cy} stroke={color} strokeWidth={sw * 0.6} opacity={0.5} />
    </g>
  );
}

/** Repères d'angle type plan technique. */
export function RegistrationTicks({
  w,
  h,
  inset = 8,
  t = 6,
  color = CHAMP,
}: {
  w: number;
  h: number;
  inset?: number;
  t?: number;
  color?: string;
}) {
  const pts = [
    [inset, inset],
    [w - inset, inset],
    [inset, h - inset],
    [w - inset, h - inset],
  ] as const;
  return (
    <g stroke={color} strokeWidth={1} opacity={0.7}>
      {pts.map(([x, y], i) => {
        const dx = x < w / 2 ? t : -t;
        const dy = y < h / 2 ? t : -t;
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x + dx} y2={y} />
            <line x1={x} y1={y} x2={x} y2={y + dy} />
          </g>
        );
      })}
    </g>
  );
}

const FIG_CLASS = "mx-auto h-44 w-full max-w-[230px] sm:h-48";

const monoLabel = {
  fontFamily: "ui-monospace, monospace",
};

/** 01 — Offre déposée dans une boîte scellée (montant caché). */
export function FigureSealed({ spin }: { spin?: boolean }) {
  return (
    <svg
      viewBox="0 0 160 140"
      className={FIG_CLASS}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <RegistrationTicks w={160} h={140} />
      {/* mécanisme (fantaisie) */}
      <Gear cx={32} cy={114} r={12} teeth={9} sw={1.1} color={INK_SOFT} spin={spin} opacity={0.7} />
      {/* boîte */}
      <rect x={42} y={44} width={76} height={62} rx={3} stroke={INK} strokeWidth={1.7} />
      {/* fente de dépôt */}
      <rect x={66} y={40} width={28} height={6} rx={3} fill={INK} />
      {/* offre qui tombe */}
      <line x1={80} y1={14} x2={80} y2={36} stroke={CHAMP} strokeWidth={1.2} strokeDasharray="3 3" />
      <path d="M75 31 L80 37 L85 31" stroke={CHAMP} strokeWidth={1.2} />
      {/* contenu scellé */}
      <rect x={56} y={60} width={48} height={34} rx={2} stroke={CHAMP} strokeWidth={1.2} strokeDasharray="3 3" />
      <text x={80} y={84} textAnchor="middle" style={monoLabel} fontSize={18} fill={CHAMP}>
        €
      </text>
      {/* annotation T-1H */}
      <line x1={94} y1={44} x2={124} y2={30} stroke={CHAMP} strokeWidth={0.8} strokeDasharray="2 2" />
      <text x={126} y={28} style={monoLabel} fontSize={7} letterSpacing="1" fill={CHAMP}>
        T-1H
      </text>
      {/* numéro de planche */}
      <text x={14} y={22} style={monoLabel} fontSize={9} letterSpacing="2" fill={CHAMP}>
        01
      </text>
    </svg>
  );
}

/** 02 — La boîte s'ouvre à T : les offres se révèlent. */
export function FigureReveal({ spin }: { spin?: boolean }) {
  const bars = [
    { x: 58, y: 58, h: 18 },
    { x: 76, y: 48, h: 28 },
    { x: 94, y: 60, h: 16 },
  ];
  return (
    <svg
      viewBox="0 0 160 140"
      className={FIG_CLASS}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <RegistrationTicks w={160} h={140} />
      {/* mécanisme d'ouverture */}
      <Gear cx={130} cy={116} r={11} teeth={9} sw={1.1} color={INK_SOFT} spin={spin} reverse opacity={0.7} />
      {/* boîte */}
      <rect x={42} y={66} width={76} height={40} rx={3} stroke={INK} strokeWidth={1.7} />
      {/* couvercle relevé */}
      <path d="M42 66 L56 48 L132 48 L118 66" stroke={INK} strokeWidth={1.7} />
      {/* offres révélées */}
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={10} height={b.h} stroke={INK} strokeWidth={1.3} />
          <rect x={b.x} y={b.y} width={10} height={4} fill={CHAMP_FILL} opacity={0.55} />
        </g>
      ))}
      {/* horloge — révélation */}
      <circle cx={126} cy={30} r={12} stroke={CHAMP} strokeWidth={1.2} />
      <line x1={126} y1={30} x2={126} y2={22} stroke={CHAMP} strokeWidth={1.2} />
      <line x1={126} y1={30} x2={132} y2={32} stroke={CHAMP} strokeWidth={1.2} />
      <text x={14} y={22} style={monoLabel} fontSize={9} letterSpacing="2" fill={CHAMP}>
        02
      </text>
    </svg>
  );
}

/** 03 — Offres triées : prix unique = la N-ième offre retenue. */
export function FigureClearing({ spin }: { spin?: boolean }) {
  const baseline = 110;
  const clearing = 62;
  const w = 14;
  const bars = [
    { x: 30, top: 40, win: true },
    { x: 49, top: 50, win: true },
    { x: 68, top: 62, win: true },
    { x: 87, top: 72, win: false },
    { x: 106, top: 86, win: false },
  ];
  return (
    <svg
      viewBox="0 0 160 140"
      className={FIG_CLASS}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <RegistrationTicks w={160} h={140} />
      {/* mécanisme de calcul (fantaisie) */}
      <Gear cx={134} cy={118} r={10} teeth={8} sw={1.1} color={INK_SOFT} spin={spin} opacity={0.7} />
      {/* prix payé (uniforme) — remplissage des gagnantes */}
      {bars
        .filter((b) => b.win)
        .map((b, i) => (
          <rect key={`f-${i}`} x={b.x} y={clearing} width={w} height={baseline - clearing} fill={CHAMP_FILL} opacity={0.22} />
        ))}
      {/* contours des offres */}
      {bars.map((b, i) => (
        <rect key={`b-${i}`} x={b.x} y={b.top} width={w} height={baseline - b.top} stroke={INK} strokeWidth={1.3} />
      ))}
      {/* socle */}
      <line x1={24} y1={baseline} x2={134} y2={baseline} stroke={INK} strokeWidth={1.7} />
      {/* ligne de prix unique */}
      <line x1={20} y1={clearing} x2={140} y2={clearing} stroke={CHAMP} strokeWidth={1.2} strokeDasharray="3 3" />
      <circle cx={75} cy={clearing} r={3} fill={CHAMP} />
      <text x={122} y={58} style={monoLabel} fontSize={8} letterSpacing="1" fill={CHAMP}>
        Nᵉ
      </text>
      <text x={14} y={22} style={monoLabel} fontSize={9} letterSpacing="2" fill={CHAMP}>
        03
      </text>
    </svg>
  );
}
