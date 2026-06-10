import * as React from "react";
import { cn } from "@/lib/utils";

/** Tonalités de badge, lisibles sur fond dark, accordées au design system. */
export type Tone = "champagne" | "green" | "amber" | "violet" | "zinc" | "red";

const TONE: Record<Tone, string> = {
  champagne: "bg-[var(--champagne)]/15 text-[var(--champagne)] ring-[var(--champagne)]/30",
  green: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  violet: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  zinc: "bg-white/5 text-muted-foreground ring-white/10",
  red: "bg-red-500/15 text-red-300 ring-red-500/30",
};

export function Badge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ring-1 ring-inset",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Carte de contenu standard du back-office. */
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-card p-5", className)}>{children}</div>;
}

/** Bloc KPI. */
export function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

/** En-tête de page : titre éditorial + sous-titre. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
