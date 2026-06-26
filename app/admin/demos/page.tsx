import { createClient } from "@/lib/supabase/server";
import { Card, Kpi, PageHeader, Badge } from "@/lib/admin/ui";

export const dynamic = "force-dynamic";

type Visit = {
  id: string;
  slug: string;
  surface: string;
  locale: string;
  ip: string | null;
  user_agent: string | null;
  path: string | null;
  opened_at: string;
};

function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

/** Résumé lisible du navigateur/OS depuis le user-agent (best-effort). */
function shortUA(ua: string | null): string {
  if (!ua) return "—";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua) && !/Chromium/.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navigateur";
  const os = /iPhone|iPad|iOS/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X|Macintosh/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}

export default async function DemosPage() {
  const supabase = createClient();
  const [{ data: visitsRaw }, { data: brands }] = await Promise.all([
    supabase
      .from("demo_visits")
      .select("id, slug, surface, locale, ip, user_agent, path, opened_at")
      .order("opened_at", { ascending: false })
      .limit(500),
    supabase.from("brands").select("slug, name").eq("is_demo", true),
  ]);

  const visits = (visitsRaw ?? []) as Visit[];
  const nameBySlug = new Map(
    ((brands ?? []) as { slug: string; name: string }[]).map((b) => [b.slug, b.name]),
  );

  // Synthèse par maison : nombre d'ouvertures + dernière ouverture + surfaces.
  const bySlug = new Map<
    string,
    { count: number; last: string; surfaces: Set<string> }
  >();
  for (const v of visits) {
    const cur =
      bySlug.get(v.slug) ?? { count: 0, last: v.opened_at, surfaces: new Set<string>() };
    cur.count += 1;
    cur.surfaces.add(v.surface);
    if (v.opened_at > cur.last) cur.last = v.opened_at;
    bySlug.set(v.slug, cur);
  }
  const summary = Array.from(bySlug.entries()).sort((a, b) =>
    a[1].last < b[1].last ? 1 : -1,
  );

  const dayAgo = Date.now() - 86_400_000;
  const last24 = visits.filter((v) => new Date(v.opened_at).getTime() >= dayAgo).length;

  return (
    <>
      <PageHeader
        title="Démos"
        subtitle="Ouvertures des liens démo prospects. Chaque ligne = un lien ouvert avec une clé valide (best-effort, force-dynamic)."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Ouvertures · total" value={visits.length} />
        <Kpi label="Ouvertures · 24h" value={last24} />
        <Kpi label="Maisons qui ont ouvert" value={bySlug.size} />
        <Kpi
          label="Dernière ouverture"
          value={summary.length ? fmtDateTime(summary[0][1].last) : "—"}
        />
      </div>

      <Card className="mt-4">
        <h3 className="font-display text-xl">Par maison</h3>
        {summary.length ? (
          <ul className="mt-3 divide-y divide-border/60">
            {summary.map(([slug, s]) => (
              <li
                key={slug}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium">{nameBySlug.get(slug) ?? slug}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    {Array.from(s.surfaces).sort().join(" + ")}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {s.count} ouverture{s.count > 1 ? "s" : ""} · dernière {fmtDateTime(s.last)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune ouverture enregistrée pour le moment.
          </p>
        )}
      </Card>

      <Card className="mt-4">
        <h3 className="font-display text-xl">Ouvertures récentes</h3>
        {visits.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Maison</th>
                  <th className="py-2 pr-3 font-medium">Page</th>
                  <th className="py-2 pr-3 font-medium">Quand</th>
                  <th className="py-2 pr-3 font-medium">Navigateur</th>
                  <th className="py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {visits.slice(0, 60).map((v) => (
                  <tr key={v.id} className="border-b border-border/40">
                    <td className="py-2 pr-3 font-medium">
                      {nameBySlug.get(v.slug) ?? v.slug}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge tone={v.surface === "maison" ? "zinc" : "champagne"}>
                        {v.surface}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {fmtDateTime(v.opened_at)}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {shortUA(v.user_agent)}
                    </td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">
                      {v.ip ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Rien à afficher.</p>
        )}
      </Card>
    </>
  );
}
