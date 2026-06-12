import * as React from "react";

import { Card } from "@/lib/admin/ui";
import type { LabelCount, SeriesPoint } from "@/lib/analytics/posthog";

// Cadrans analytics du back-office : SVG inline, zéro dépendance chart.
// Server components (pas de "use client").

/** Courbe minimaliste (vues/jour). Champagne, fill léger. */
export function Sparkline({
  series, height = 48, className,
}: {
  series: SeriesPoint[];
  height?: number;
  className?: string;
}) {
  const w = 240;
  const values = series.map((p) => p.views);
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 4 - (v / max) * (height - 8)).toFixed(1)}`);
  const line = pts.join(" ");
  const area = `0,${height} ${line} ${w},${height}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={className ?? "h-12 w-full"}
      role="img"
      aria-label="Évolution des vues"
    >
      <polygon points={area} fill="var(--champagne)" opacity="0.12" />
      <polyline points={line} fill="none" stroke="var(--champagne)" strokeWidth="1.5" />
    </svg>
  );
}

/** Liste à barres proportionnelles (pays, referrers, devices…). */
export function BarList({ items, total }: { items: LabelCount[]; total?: number }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  const sum = total ?? items.reduce((s, i) => s + i.count, 0);
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i.label} className="text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate">{i.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {i.count}{sum > 0 ? ` · ${Math.round((i.count / sum) * 100)}%` : ""}
            </span>
          </div>
          <div className="mt-0.5 h-1 rounded bg-white/5">
            <div
              className="h-1 rounded bg-[var(--champagne)]/60"
              style={{ width: `${Math.max(2, (i.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** État « PostHog non branché » avec les étapes de setup. */
export function AnalyticsNotConfigured({ compact }: { compact?: boolean }) {
  return (
    <Card className={compact ? "p-4" : undefined}>
      <h3 className="font-display text-lg">Audience non branchée</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Le tracking vitrine est prêt (pageviews + vues par montre). Pour activer les cadrans :
        crée un projet PostHog (EU cloud), puis pose dans l&apos;env :
        {" "}<span className="font-mono">NEXT_PUBLIC_POSTHOG_KEY</span> (clé projet, côté navigateur),
        {" "}<span className="font-mono">POSTHOG_PROJECT_ID</span> et
        {" "}<span className="font-mono">POSTHOG_PERSONAL_API_KEY</span> (scope query:read, côté serveur).
      </p>
    </Card>
  );
}

/** Petit indisponible (clé posée mais API en erreur / pas encore de données). */
export function AnalyticsEmpty({ label }: { label?: string }) {
  return (
    <p className="text-sm text-muted-foreground">{label ?? "Pas encore de données."}</p>
  );
}
