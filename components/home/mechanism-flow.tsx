import { ChevronDown, ChevronRight } from "lucide-react";

/*
 * Mécanisme du drop scellé en flux « blueprint » : trois planches techniques
 * dessinées au trait (ink) avec traits de construction pointillés (champagne),
 * sur fond transparent, reliées en suite logique. Composant serveur : 100% SVG.
 */

const INK = "var(--foreground)";
const CHAMP = "var(--champagne-deep)";
const CHAMP_FILL = "var(--champagne)";

/** Repères d'angle d'une planche (coins type plan technique). */
function RegistrationTicks() {
  const t = 5; // longueur du repère
  const corners = [
    [6, 8],
    [134, 8],
    [6, 96],
    [134, 96],
  ] as const;
  return (
    <g stroke={CHAMP} strokeWidth={1} opacity={0.7}>
      {corners.map(([x, y], i) => (
        <g key={i}>
          <line x1={x - (x > 70 ? t : -t)} y1={y} x2={x} y2={y} />
          <line x1={x} y1={y - (y > 52 ? t : -t)} x2={x} y2={y} />
        </g>
      ))}
    </g>
  );
}

function FigureFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 140 104"
      className="h-[104px] w-full"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <RegistrationTicks />
      {children}
    </svg>
  );
}

/** 01 — Offre déposée dans une boîte scellée (contenu caché). */
function SchematicSealed() {
  return (
    <FigureFrame>
      {/* boîte */}
      <rect x={32} y={34} width={76} height={54} rx={2} stroke={INK} strokeWidth={1.25} />
      {/* fente de dépôt */}
      <rect x={56} y={31} width={28} height={5} rx={2.5} fill={INK} />
      {/* offre qui tombe dans la fente (trait de construction) */}
      <line x1={70} y1={10} x2={70} y2={27} stroke={CHAMP} strokeWidth={1} strokeDasharray="3 3" />
      <path d="M66 22 L70 28 L74 22" stroke={CHAMP} strokeWidth={1} />
      {/* contenu scellé / caché */}
      <rect x={46} y={50} width={48} height={28} rx={2} stroke={CHAMP} strokeWidth={1} strokeDasharray="3 3" />
      <text x={70} y={70} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize={15} fill={CHAMP}>
        €
      </text>
    </FigureFrame>
  );
}

/** 02 — La boîte s'ouvre à T : les offres se révèlent. */
function SchematicReveal() {
  return (
    <FigureFrame>
      {/* boîte ouverte */}
      <rect x={32} y={48} width={76} height={40} rx={2} stroke={INK} strokeWidth={1.25} />
      {/* couvercle relevé */}
      <path d="M32 48 L46 32 L122 32 L108 48" stroke={INK} strokeWidth={1.25} />
      {/* offres révélées (barres qui sortent) */}
      <rect x={48} y={40} width={9} height={16} stroke={INK} strokeWidth={1.1} />
      <rect x={48} y={40} width={9} height={4} fill={CHAMP_FILL} opacity={0.5} />
      <rect x={66} y={34} width={9} height={22} stroke={INK} strokeWidth={1.1} />
      <rect x={66} y={34} width={9} height={4} fill={CHAMP_FILL} opacity={0.5} />
      <rect x={84} y={42} width={9} height={14} stroke={INK} strokeWidth={1.1} />
      <rect x={84} y={42} width={9} height={4} fill={CHAMP_FILL} opacity={0.5} />
      {/* horloge T (révélation) */}
      <circle cx={111} cy={22} r={9} stroke={CHAMP} strokeWidth={1} />
      <line x1={111} y1={22} x2={111} y2={16} stroke={CHAMP} strokeWidth={1} />
      <line x1={111} y1={22} x2={116} y2={24} stroke={CHAMP} strokeWidth={1} />
    </FigureFrame>
  );
}

/** 03 — Offres triées : prix unique = la N-ième offre retenue. */
function SchematicClearing() {
  const baseline = 86;
  const clearing = 52; // ligne de prix (3e offre)
  const bars = [
    { x: 28, top: 36, win: true },
    { x: 45, top: 44, win: true },
    { x: 62, top: 52, win: true },
    { x: 79, top: 60, win: false },
    { x: 96, top: 72, win: false },
  ];
  const w = 12;
  return (
    <FigureFrame>
      {/* remplissage champagne « prix payé » (uniforme) pour les gagnantes */}
      {bars
        .filter((b) => b.win)
        .map((b, i) => (
          <rect
            key={`fill-${i}`}
            x={b.x}
            y={clearing}
            width={w}
            height={baseline - clearing}
            fill={CHAMP_FILL}
            opacity={0.22}
          />
        ))}
      {/* contours des offres (hauteur = montant proposé) */}
      {bars.map((b, i) => (
        <rect
          key={`bar-${i}`}
          x={b.x}
          y={b.top}
          width={w}
          height={baseline - b.top}
          stroke={INK}
          strokeWidth={1.1}
        />
      ))}
      {/* socle */}
      <line x1={22} y1={baseline} x2={116} y2={baseline} stroke={INK} strokeWidth={1.25} />
      {/* ligne de prix unique (la N-ième) */}
      <line x1={20} y1={clearing} x2={120} y2={clearing} stroke={CHAMP} strokeWidth={1} strokeDasharray="3 3" />
      <circle cx={68} cy={clearing} r={2.5} fill={CHAMP} />
    </FigureFrame>
  );
}

type Step = {
  n: string;
  tag: string;
  label: string;
  desc: string;
  Schematic: () => React.ReactNode;
  delay: number;
};

const STEPS: Step[] = [
  {
    n: "01",
    tag: "DÉPÔT",
    label: "Offre scellée",
    desc: "Vous scellez votre prix. Invisible des autres jusqu'à la révélation.",
    Schematic: SchematicSealed,
    delay: 700,
  },
  {
    n: "02",
    tag: "T = 0",
    label: "Révélation",
    desc: "À l'heure dite, toutes les offres s'ouvrent d'un seul coup.",
    Schematic: SchematicReveal,
    delay: 840,
  },
  {
    n: "03",
    tag: "CLEARING",
    label: "Prix unique",
    desc: "Les plus hautes offres gagnent, et toutes payent le même prix.",
    Schematic: SchematicClearing,
    delay: 980,
  },
];

function Connector({ delay }: { delay: number }) {
  return (
    <li
      className="reveal flex list-none items-center justify-center sm:h-[104px] sm:w-12 sm:shrink-0"
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* desktop : flux horizontal */}
      <div className="hidden w-full items-center gap-1.5 sm:flex">
        <span className="h-px flex-1 border-t border-dashed border-champagne" />
        <ChevronRight className="size-4 shrink-0 text-[var(--champagne-deep)]" strokeWidth={1.5} />
      </div>
      {/* mobile : flux vertical */}
      <div className="flex flex-col items-center gap-1 py-2 sm:hidden">
        <span className="h-6 w-px border-l border-dashed border-champagne" />
        <ChevronDown className="size-4 text-[var(--champagne-deep)]" strokeWidth={1.5} />
      </div>
    </li>
  );
}

function StepItem({ step }: { step: Step }) {
  return (
    <li
      className="reveal flex min-w-0 flex-col gap-3 sm:flex-1"
      style={{ "--reveal-delay": `${step.delay}ms` } as React.CSSProperties}
    >
      <step.Schematic />
      <div className="mt-1 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--champagne-deep)]">
        <span>{step.n}</span>
        <span className="h-px flex-1 self-center bg-rule-soft" />
        <span>{step.tag}</span>
      </div>
      <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-foreground">
        {step.label}
      </span>
      <p className="text-sm leading-relaxed text-ink-2">{step.desc}</p>
    </li>
  );
}

export function MechanismFlow() {
  return (
    <ol className="flex flex-col gap-y-2 sm:flex-row sm:items-start sm:gap-y-0">
      <StepItem step={STEPS[0]} />
      <Connector delay={770} />
      <StepItem step={STEPS[1]} />
      <Connector delay={910} />
      <StepItem step={STEPS[2]} />
    </ol>
  );
}
