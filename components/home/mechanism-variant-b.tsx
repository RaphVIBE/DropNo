import { ChevronDown, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  CHAMP,
  FigureClearing,
  FigureReveal,
  FigureSealed,
  Gear,
  INK_SOFT,
} from "./blueprint";

/* Mécanisme « vivant » : trois planches blueprint reliées par des flèches,
 * cogs internes en rotation lente et horlogerie discrète en arrière-plan.
 * Nom de l'étape sous chaque figure. prefers-reduced-motion respecté. */

type StepDef = {
  Figure: (props: { spin?: boolean }) => React.ReactNode;
  label: string;
  delay: number;
};


function Arrow({ delay }: { delay: number }) {
  return (
    <div
      className="reveal flex items-center justify-center sm:w-14 sm:self-start sm:mt-[88px]"
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* desktop : flèche horizontale */}
      <div className="hidden w-full items-center gap-1.5 sm:flex">
        <span className="h-px flex-1 border-t border-dashed border-champagne" />
        <ChevronRight className="size-4 shrink-0 text-[var(--champagne-deep)]" strokeWidth={1.5} />
      </div>
      {/* mobile : flèche verticale */}
      <div className="flex flex-col items-center gap-1 py-2 sm:hidden">
        <span className="h-6 w-px border-l border-dashed border-champagne" />
        <ChevronDown className="size-4 text-[var(--champagne-deep)]" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function StepColumn({ Figure, label, delay }: StepDef) {
  return (
    <div
      className="reveal flex w-full flex-col items-center gap-4 sm:flex-1"
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      <Figure spin />
      <span className="text-center text-[13px] font-medium uppercase tracking-[0.16em] text-foreground">
        {label}
      </span>
    </div>
  );
}

/** Horlogerie discrète en arrière-plan. */
function ClockworkBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      viewBox="0 0 600 220"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <Gear cx={70} cy={170} r={64} teeth={15} sw={1} color={INK_SOFT} spin opacity={0.07} />
      <Gear cx={150} cy={150} r={30} teeth={10} sw={1} color={INK_SOFT} spin reverse opacity={0.06} />
      <Gear cx={530} cy={48} r={52} teeth={13} sw={1} color={CHAMP} spin reverse opacity={0.08} />
    </svg>
  );
}

export async function MechanismVariantB() {
  const t = await getTranslations("mecanisme");

  const STEPS: StepDef[] = [
    { Figure: FigureSealed, label: t("steps.sealed"), delay: 700 },
    { Figure: FigureReveal, label: t("steps.reveal"), delay: 840 },
    { Figure: FigureClearing, label: t("steps.clearing"), delay: 980 },
  ];

  return (
    <div className="relative">
      <ClockworkBackdrop />
      <ol className="relative flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-2">
        <li className="contents">
          <StepColumn {...STEPS[0]} />
        </li>
        <li className="contents" aria-hidden="true">
          <Arrow delay={770} />
        </li>
        <li className="contents">
          <StepColumn {...STEPS[1]} />
        </li>
        <li className="contents" aria-hidden="true">
          <Arrow delay={910} />
        </li>
        <li className="contents">
          <StepColumn {...STEPS[2]} />
        </li>
      </ol>
    </div>
  );
}
