import { createClient } from "@/lib/supabase/server";
import { Badge, Kpi, Card } from "@/lib/admin/ui";
import { eur, dateTime } from "@/lib/admin/format";
import { STATUS_FR, STATUS_TONE, type DropStatus } from "@/lib/admin/drops";

export const dynamic = "force-dynamic";

type Metric = {
  drop_id: string; drop_number: number; title: string; status: DropStatus;
  exemplaires: number; floor_price_cents: number; clearing_price_cents: number | null;
  reveal_at: string | null; bid_count: number; bidders: number; qualified_bids: number;
  watchers: number; units_sold: number | null; gross_cents: number | null; payout_cents: number | null;
};

export default async function MaisonDashboard() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_maison_drop_metrics", {});
  const rows = (data ?? []) as Metric[];

  const live = rows.filter((r) => r.status === "open");
  const totalBids = rows.reduce((s, r) => s + Number(r.bid_count ?? 0), 0);
  const watchers = rows.reduce((s, r) => s + Number(r.watchers ?? 0), 0);
  const payout = rows.reduce((s, r) => s + Number(r.payout_cents ?? 0), 0);

  return (
    <>
      <h1 className="font-display text-3xl">Tableau de bord</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Suivi live de tes drops. Montants masqués jusqu&apos;au reveal (enchères scellées).</p>

      {error && <p className="mb-4 text-sm text-red-300">Erreur : {error.message}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Drops actifs" value={live.length} />
        <Kpi label="Enchères" value={totalBids} />
        <Kpi label="Watchers" value={watchers} />
        <Kpi label="Payout cumulé" value={eur(payout)} />
      </div>

      <div className="mt-6 space-y-3">
        {rows.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Aucun drop pour le moment.</div>
        )}
        {rows.map((d) => {
          const ratio = d.exemplaires ? Math.round((Number(d.bid_count) / d.exemplaires) * 100) : 0;
          const revealed = d.status === "revealed";
          return (
            <Card key={d.drop_id} className={d.status === "open" ? "border-emerald-500/40" : ""}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-base">№ {d.drop_number} · {d.title}</strong>
                <Badge tone={STATUS_TONE[d.status]}>{STATUS_FR[d.status]}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Metricule label="Enchères" value={d.bid_count} />
                <Metricule label="Enchérisseurs" value={d.bidders} />
                <Metricule label="≥ plancher" value={d.qualified_bids} />
                <Metricule label="Demande" value={`${ratio}%`} />
                <Metricule label="Watchers" value={d.watchers} />
              </div>

              {revealed ? (
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-4">
                  <Metricule label="Prix de clôture" value={eur(d.clearing_price_cents)} />
                  <Metricule label="Vendus" value={`${d.units_sold ?? 0}/${d.exemplaires}`} />
                  <Metricule label="CA brut" value={eur(d.gross_cents)} />
                  <Metricule label="Payout" value={eur(d.payout_cents)} />
                </div>
              ) : (
                <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
                  🔒 Enchères scellées — montants &amp; prix de clôture visibles au reveal{d.reveal_at ? ` (${dateTime(d.reveal_at)})` : ""}.
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Metricule({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-base font-semibold">{value}</div>
    </div>
  );
}
