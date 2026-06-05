/*
 * Filigrane Drop No. — emblème technique « blueprint » (cadran horloger /
 * compas) à poser en watermark discret sur chaque écran. Couleur et opacité
 * pilotées par le parent via className (stroke = currentColor). Décoratif.
 */

const CX = 100;
const CY = 100;

function tick(i: number) {
  const major = i % 5 === 0;
  const outer = 80;
  const inner = major ? 68 : 74;
  const a = ((i * 6 - 90) * Math.PI) / 180;
  return {
    x1: CX + inner * Math.cos(a),
    y1: CY + inner * Math.sin(a),
    x2: CX + outer * Math.cos(a),
    y2: CY + outer * Math.sin(a),
    major,
  };
}

export function Filigrane({ className }: { className?: string }) {
  const ticks = Array.from({ length: 60 }, (_, i) => tick(i));
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {/* cercles du cadran */}
      <circle cx={CX} cy={CY} r={84} strokeWidth={1} />
      <circle cx={CX} cy={CY} r={62} strokeWidth={1} opacity={0.65} />
      {/* graduations */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          strokeWidth={t.major ? 1.4 : 0.8}
          opacity={t.major ? 1 : 0.6}
        />
      ))}
      {/* croix de visée centrale */}
      <line x1={CX} y1={CY - 22} x2={CX} y2={CY + 22} strokeWidth={1} />
      <line x1={CX - 22} y1={CY} x2={CX + 22} y2={CY} strokeWidth={1} />
      <circle cx={CX} cy={CY} r={4} strokeWidth={1.2} />
      {/* repères d'angle (cartouche de plan) */}
      <g strokeWidth={1}>
        <path d="M14 30 V14 H30" />
        <path d="M170 14 H186 V30" />
        <path d="M186 170 V186 H170" />
        <path d="M30 186 H14 V170" />
      </g>
    </svg>
  );
}
