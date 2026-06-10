import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

// ---------------------------------------------------------------------------
// Contrôles de liste : filtres, recherche, pagination (server-component safe)
// ---------------------------------------------------------------------------

type Params = Record<string, string | number | undefined | null>;

/** Sérialise des paramètres en query string (ignore vides / "all"). */
export function qs(params: Params): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "" && v !== "all") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const tabCls = (on: boolean) =>
  cn(
    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
    on
      ? "border-transparent bg-primary text-primary-foreground"
      : "border-border text-muted-foreground hover:text-foreground"
  );

/** Onglets de filtre par statut (réinitialise la page). */
export function FilterTabs({
  basePath,
  tabs,
  active,
  params,
}: {
  basePath: string;
  tabs: { key: string; label: string }[];
  active: string;
  params?: Params;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={`${basePath}${qs({ ...params, status: t.key, page: undefined })}`}
          className={tabCls(active === t.key)}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

/** Recherche (formulaire GET, sans JS). `hidden` préserve les autres filtres. */
export function SearchBox({
  basePath,
  defaultValue,
  placeholder,
  hidden,
}: {
  basePath: string;
  defaultValue?: string;
  placeholder?: string;
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form action={basePath} className="mb-4 flex gap-2">
      {hidden &&
        Object.entries(hidden).map(([k, v]) =>
          v ? <input key={k} type="hidden" name={k} value={v} /> : null
        )}
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder ?? "Rechercher…"}
        className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button type="submit" variant="outline" size="sm">Rechercher</Button>
      {defaultValue ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={`${basePath}${qs({ ...hidden })}`}>Effacer</Link>
        </Button>
      ) : null}
    </form>
  );
}

const navCls = (disabled: boolean) =>
  cn(
    "rounded-md border border-border px-3 py-1.5 text-sm transition-colors",
    disabled
      ? "pointer-events-none opacity-40"
      : "text-muted-foreground hover:text-foreground"
  );

/** Pagination prev/suivant (préserve les filtres). */
export function Pagination({
  basePath,
  page,
  hasNext,
  params,
}: {
  basePath: string;
  page: number;
  hasNext: boolean;
  params?: Params;
}) {
  if (page <= 1 && !hasNext) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Page {page}</span>
      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          href={`${basePath}${qs({ ...params, page: page - 1 <= 1 ? undefined : page - 1 })}`}
          className={navCls(page <= 1)}
        >
          ← Précédent
        </Link>
        <Link
          aria-disabled={!hasNext}
          href={`${basePath}${qs({ ...params, page: page + 1 })}`}
          className={navCls(!hasNext)}
        >
          Suivant →
        </Link>
      </div>
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
