import { formatEuros } from "@/lib/format";

export function DropSpecs({
  floorPriceCents,
  exemplaires,
}: {
  floorPriceCents: number;
  exemplaires: number;
}) {
  return (
    <div className="mb-8 grid grid-cols-2">
      <Spec label="Prix plancher" value={formatEuros(floorPriceCents)} />
      <Spec label="Exemplaires" value={String(exemplaires)} bordered />
    </div>
  );
}

function Spec({
  label,
  value,
  bordered,
}: {
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`border-t border-rule-soft py-[18px] ${
        bordered ? "border-l pl-4" : "pr-4"
      }`}
    >
      <div className="mb-1.5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="font-serif text-2xl italic">{value}</div>
    </div>
  );
}
