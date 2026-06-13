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
  Figure: (props: { spin?: boolean; className?: string }) => React.ReactNode;
  label: string;
  delay: number;
};

/** Figures plus petites quand le schéma est empilé en colonne étroite. */
const COMPACT_FIG = "mx-auto h-28 w-full max-w-[150px]";
/** Mode compact responsive : mini en ligne sur mobile, normal vertical dès md. */
const RESPONSIVE_FIG =
  "mx-auto h-16 w-full max-w-[92px] md:h-28 md:max-w-[150px]";

type Mode = "auto" | "vertical" | "compact";

function Arrow({ delay, mode }: { delay: number; mode: Mode }) {
  const vertical = mode === "vertical";
  const compact = mode === "compact";
  const outer = compact
    ? "reveal flex w-4 items-center justify-center self-center md:w-auto md:self-auto"
    : `reveal flex items-center justify-center ${
        vertical ? "" : "sm:w-14 sm:self-start sm:mt-[88px]"
      }`;
  return (
    <div
      className={outer}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* flèche horizontale — desktop en mode auto, mobile en mode compact */}
      {vertical ? null : (
        <div
          className={
            compact
              ? "flex w-full items-center gap-0.5 md:hidden"
              : "hidden w-full items-center gap-1.5 sm:flex"
          }
        >
          <span className="h-px flex-1 border-t border-dashed border-champagne" />
          <ChevronRight
            className={`${compact ? "size-3" : "size-4"} shrink-0 text-[var(--champagne-deep)]`}
            strokeWidth={1.5}
          />
        </div>
      )}
      {/* flèche verticale — mode vertical (toujours), mobile en auto, md+ en compact */}
      <div
        className={`flex-col items-center ${
          vertical
            ? "flex gap-0.5 py-1"
            : compact
              ? "hidden gap-0.5 py-1 md:flex"
              : "flex gap-1 py-2 sm:hidden"
        }`}
      >
        <span
          className={`${vertical || compact ? "h-4" : "h-6"} w-px border-l border-dashed border-champagne`}
        />
        <ChevronDown className="size-4 text-[var(--champagne-deep)]" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function StepColumn({
  Figure,
  label,
  delay,
  mode,
}: StepDef & { mode: Mode }) {
  const vertical = mode === "vertical";
  const compact = mode === "compact";
  const colClass = compact
    ? "flex min-w-0 flex-1 flex-col items-center gap-1.5 md:w-full md:flex-none md:gap-2"
    : vertical
      ? "flex w-full flex-col items-center gap-2"
      : "flex w-full flex-col items-center gap-4 sm:flex-1";
  const figClass = compact ? RESPONSIVE_FIG : vertical ? COMPACT_FIG : undefined;
  return (
    <div
      className={`reveal ${colClass}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      <Figure spin className={figClass} />
      <span
        className={`text-center font-medium uppercase tracking-[0.16em] text-foreground ${
          compact ? "text-[10px] md:text-[13px]" : "text-[13px]"
        }`}
      >
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

export async function MechanismVariantB({
  orientation = "auto",
}: {
  /** "auto" : empilé en mobile, en ligne dès sm (pleine largeur).
   *  "vertical" : toujours empilé, figures compactes (colonne étroite).
   *  "compact" : mini en ligne sur mobile, vertical compact dès md (home). */
  orientation?: Mode;
}) {
  const t = await getTranslations("mecanisme");
  const compact = orientation === "compact";

  const STEPS: StepDef[] = [
    { Figure: FigureSealed, label: t("steps.sealed"), delay: 700 },
    { Figure: FigureReveal, label: t("steps.reveal"), delay: 840 },
    { Figure: FigureClearing, label: t("steps.clearing"), delay: 980 },
  ];

  // En ligne large (auto) : horlogerie de fond. Compact/vertical : trop étroit.
  const showBackdrop = orientation === "auto";
  const olClass = compact
    ? "relative flex flex-row items-center gap-1.5 md:flex-col md:items-center md:gap-3"
    : `relative flex flex-col items-center gap-3 ${
        orientation === "vertical" ? "" : "sm:flex-row sm:items-start sm:gap-2"
      }`;

  return (
    <div className="relative">
      {showBackdrop ? <ClockworkBackdrop /> : null}
      <ol className={olClass}>
        <li className="contents">
          <StepColumn {...STEPS[0]} mode={orientation} />
        </li>
        <li className="contents" aria-hidden="true">
          <Arrow delay={770} mode={orientation} />
        </li>
        <li className="contents">
          <StepColumn {...STEPS[1]} mode={orientation} />
        </li>
        <li className="contents" aria-hidden="true">
          <Arrow delay={910} mode={orientation} />
        </li>
        <li className="contents">
          <StepColumn {...STEPS[2]} mode={orientation} />
        </li>
      </ol>
    </div>
  );
}
