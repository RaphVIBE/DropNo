import {
  CHAMP,
  FigureClearing,
  FigureReveal,
  FigureSealed,
  Gear,
  INK_SOFT,
} from "./blueprint";

/* Variante B — « Mécanisme vivant » : mêmes schémas, mais reliés par des
 * engrenages qui s'engrènent, et une horlogerie qui tourne lentement en fond.
 * Sans texte. Le mouvement respecte prefers-reduced-motion. */

/** Paire d'engrenages d'entraînement entre deux étapes. */
function GearMesh() {
  return (
    <div className="flex items-center justify-center sm:w-16 sm:self-center">
      <svg viewBox="0 0 64 40" className="h-10 w-16" fill="none" aria-hidden="true">
        <Gear cx={22} cy={20} r={11} teeth={9} sw={1.3} color={CHAMP} spin />
        <Gear cx={45} cy={20} r={9} teeth={8} sw={1.3} color={INK_SOFT} spin reverse />
      </svg>
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

export function MechanismVariantB() {
  return (
    <div className="relative">
      <ClockworkBackdrop />
      <div className="relative flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="w-full sm:flex-1">
          <FigureSealed spin />
        </div>
        <GearMesh />
        <div className="w-full sm:flex-1">
          <FigureReveal spin />
        </div>
        <GearMesh />
        <div className="w-full sm:flex-1">
          <FigureClearing spin />
        </div>
      </div>
    </div>
  );
}
