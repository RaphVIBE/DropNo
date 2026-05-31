import Link from "next/link";

import { formatDropNumber } from "@/lib/format";

export function AccountSection({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count?: string;
  empty: string;
  children: React.ReactNode;
  /** children vide -> on affiche l'etat vide */
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <div className="mt-12">
      <div className="mb-4 flex items-baseline justify-between border-b border-foreground pb-4">
        <h2 className="font-serif text-2xl italic">{title}</h2>
        {count ? (
          <span className="text-[13px] tracking-wide text-muted-foreground">
            {count}
          </span>
        ) : null}
      </div>
      {isEmpty ? <p className="py-6 text-sm text-ink-2">{empty}</p> : children}
    </div>
  );
}

/** Ligne cliquable vers le drop, avec un badge de statut a droite. */
export function AccountRow({
  dropId,
  dropNumber,
  title,
  primary,
  secondary,
  badge,
}: {
  dropId: string | null;
  dropNumber: number | null;
  title: string | null;
  primary: string;
  secondary?: string;
  badge: { label: string; tone: "live" | "win" | "muted" | "neutral" };
}) {
  const toneClass = {
    live: "text-champagne-deep",
    win: "text-foreground",
    muted: "text-muted-foreground",
    neutral: "text-ink-2",
  }[badge.tone];

  const content = (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-rule-soft py-5 md:grid-cols-[80px_1fr_1fr_120px] md:gap-6">
      <span className="font-serif text-lg italic text-ink-2">
        {dropNumber != null ? `No. ${formatDropNumber(dropNumber)}` : "—"}
      </span>
      <span className="font-serif text-lg italic md:text-xl">
        {title ?? "Drop"}
      </span>
      <span className="text-sm text-ink-2">
        <span className="block font-serif text-base italic text-foreground">
          {primary}
        </span>
        {secondary ? (
          <span className="block text-xs text-muted-foreground">
            {secondary}
          </span>
        ) : null}
      </span>
      <span
        className={`text-right text-[11px] uppercase tracking-[0.18em] ${toneClass}`}
      >
        {badge.label}
      </span>
    </div>
  );

  if (!dropId) return content;
  return (
    <Link href={`/drop/${dropId}`} className="block transition-colors hover:bg-card">
      {content}
    </Link>
  );
}
