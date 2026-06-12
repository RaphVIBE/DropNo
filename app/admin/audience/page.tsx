import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Card, Kpi, PageHeader } from "@/lib/admin/ui";
import {
  analyticsConfigured, getDeviceSplit, getTopCountries, getTopDrops,
  getTopReferrers, getTrafficSeries, getTrafficTotals,
} from "@/lib/analytics/posthog";
import { AnalyticsEmpty, AnalyticsNotConfigured, BarList, Sparkline } from "@/components/admin/analytics";

export const dynamic = "force-dynamic";

export default async function AudiencePage() {
  if (!analyticsConfigured()) {
    return (
      <>
        <PageHeader title="Audience" subtitle="Trafic vitrine, géographie, acquisition, montres les plus vues." />
        <AnalyticsNotConfigured />
      </>
    );
  }

  const supabase = createClient();
  const [t7, t30, series30, countries, referrers, devices, topDrops, { data: dropIndex }] =
    await Promise.all([
      getTrafficTotals(7),
      getTrafficTotals(30),
      getTrafficSeries(30),
      getTopCountries(30),
      getTopReferrers(30),
      getDeviceSplit(30),
      getTopDrops(30),
      supabase.from("drops").select("id, drop_number"),
    ]);

  const idByNumber = new Map((dropIndex ?? []).map((d) => [d.drop_number, d.id]));

  return (
    <>
      <PageHeader
        title="Audience"
        subtitle="Trafic vitrine (30 jours), géographie, acquisition, montres les plus vues. Données PostHog, hors trafic interne (/admin, /maison)."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Visiteurs uniques · 7j" value={t7?.uniques ?? "—"} />
        <Kpi label="Pages vues · 7j" value={t7?.views ?? "—"} />
        <Kpi label="Visiteurs uniques · 30j" value={t30?.uniques ?? "—"} />
        <Kpi label="Pages vues · 30j" value={t30?.views ?? "—"} />
      </div>

      <Card className="mt-4">
        <h3 className="font-display text-xl">Trafic · 30 jours</h3>
        {series30 && series30.length > 0 ? (
          <Sparkline series={series30} height={72} className="mt-3 h-20 w-full" />
        ) : (
          <div className="mt-3"><AnalyticsEmpty /></div>
        )}
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="font-display text-xl">Géographie</h3>
          <div className="mt-3">
            {countries?.length ? <BarList items={countries} /> : <AnalyticsEmpty />}
          </div>
        </Card>
        <Card>
          <h3 className="font-display text-xl">Acquisition</h3>
          <div className="mt-3">
            {referrers?.length ? <BarList items={referrers} /> : <AnalyticsEmpty />}
          </div>
        </Card>
        <Card>
          <h3 className="font-display text-xl">Appareils</h3>
          <div className="mt-3">
            {devices?.length ? <BarList items={devices} /> : <AnalyticsEmpty />}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <h3 className="font-display text-xl">Montres les plus vues · 30 jours</h3>
        {topDrops?.length ? (
          <ul className="mt-3 divide-y divide-border/60">
            {topDrops.map((d) => {
              const id = idByNumber.get(d.dropNumber);
              return (
                <li key={d.dropNumber} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-display text-muted-foreground">№ {String(d.dropNumber).padStart(3, "0")}</span>{" "}
                    {id ? (
                      <Link href={`/admin/produits/${id}`} className="font-medium hover:text-[var(--champagne)]">
                        {d.title}
                      </Link>
                    ) : (
                      <span className="font-medium">{d.title}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {d.views} vues · {d.uniques} visiteurs
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-3"><AnalyticsEmpty label="Aucune vue de montre sur la période." /></div>
        )}
      </Card>
    </>
  );
}
