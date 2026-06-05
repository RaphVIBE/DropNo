import { ChevronDown, ChevronRight } from "lucide-react";

import { FigureClearing, FigureReveal, FigureSealed } from "./blueprint";

/* Variante A — « Planche agrandie » : trois schémas plus grands au trait,
 * reliés par des traits de construction pointillés. Sobre, sans texte. */

function ConnA() {
  return (
    <div className="flex items-center justify-center sm:w-14 sm:self-center">
      <div className="hidden w-full items-center gap-1.5 sm:flex">
        <span className="h-px flex-1 border-t border-dashed border-champagne" />
        <ChevronRight className="size-4 shrink-0 text-[var(--champagne-deep)]" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col items-center gap-1 py-2 sm:hidden">
        <span className="h-6 w-px border-l border-dashed border-champagne" />
        <ChevronDown className="size-4 text-[var(--champagne-deep)]" strokeWidth={1.5} />
      </div>
    </div>
  );
}

export function MechanismVariantA() {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-2">
      <div className="w-full sm:flex-1">
        <FigureSealed />
      </div>
      <ConnA />
      <div className="w-full sm:flex-1">
        <FigureReveal />
      </div>
      <ConnA />
      <div className="w-full sm:flex-1">
        <FigureClearing />
      </div>
    </div>
  );
}
