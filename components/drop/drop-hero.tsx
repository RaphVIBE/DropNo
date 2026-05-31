import { formatDropNumber, formatEuros, formatRevealMoment } from "@/lib/format";

export type DropStatus = "draft" | "scheduled" | "open" | "closed" | "revealed" | "cancelled";

export function DropHero({
  dropNumber,
  title,
  brandName,
  status,
  revealAt,
  clearingPriceCents,
}: {
  dropNumber: number;
  title: string;
  brandName: string | null;
  status: DropStatus;
  revealAt: string | null;
  clearingPriceCents: number | null;
}) {
  return (
    <div className="border-b border-rule-soft px-7 pt-14 md:px-16 md:pt-20">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-rule pb-8">
        <span className="font-serif text-[32px] italic">
          Drop No. {formatDropNumber(dropNumber)}
        </span>
        <StatusLine
          status={status}
          revealAt={revealAt}
          clearingPriceCents={clearingPriceCents}
        />
      </div>
      <div className="py-12 md:py-14">
        {brandName ? (
          <div className="mb-4 text-[13px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {brandName}
          </div>
        ) : null}
        <h1 className="font-display max-w-[12ch] text-[clamp(3.5rem,8vw,6.875rem)]">
          {title}
        </h1>
      </div>
    </div>
  );
}

function StatusLine({
  status,
  revealAt,
  clearingPriceCents,
}: {
  status: DropStatus;
  revealAt: string | null;
  clearingPriceCents: number | null;
}) {
  const base =
    "inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]";

  if (status === "open") {
    return (
      <span className={`${base} text-champagne-deep`}>
        <span className="status-dot" aria-hidden />
        En cours{revealAt ? ` · clôture ${formatRevealMoment(revealAt)}` : ""}
      </span>
    );
  }
  if (status === "scheduled") {
    return <span className={`${base} text-ink-2`}>À venir</span>;
  }
  if (status === "cancelled") {
    return <span className={`${base} text-muted-foreground`}>Annulé</span>;
  }
  // closed / revealed
  return (
    <span className={`${base} text-muted-foreground`}>
      Clôturé
      {clearingPriceCents
        ? ` · prix unitaire ${formatEuros(clearingPriceCents)}`
        : ""}
    </span>
  );
}
