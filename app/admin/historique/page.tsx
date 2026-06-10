import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Badge, Kpi } from "@/lib/admin/ui";
import { eur, dateShort } from "@/lib/admin/format";
import { STATUS_FR, STATUS_TONE, type DropStatus } from "@/lib/admin/drops";
import { AdminTabs } from "@/components/admin/tabs";

export const dynamic = "force-dynamic";

type Metric = {
  drop_id: string; drop_number: number; title: string; status: DropStatus;
  exemplaires: number; clearing_price_cents: number | null; reveal_at: string | null;
  units_sold: number | null; gross_cents: number | null; payout_cents: number | null;
};

const th = "px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-4 py-3 align-middle";

export default async function HistoriquePage() {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_maison_drop_metrics", {});
  const rows = ((data ?? []) as Metric[]).filter((d) => d.status === "revealed" || d.status === "cancelled");

  const revealed = rows.filter((d) => d.status === "revealed");
  const totalGross = revealed.reduce((s, d) => s + Number(d.gross_cents ?? 0), 0);
  const totalUnits = revealed.reduce((s, d) => s + Number(d.units_sold ?? 0), 0);
  const totalPayout = revealed.reduce((s, d) => s + Number(d.payout_cents ?? 0), 0);

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Historique</h1>
        <AdminTabs />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Drops clôturés" value={revealed.length} />
        <Kpi label="Exemplaires vendus" value={totalUnits} />
        <Kpi label="CA brut cumulé" value={eur(totalGross)} />
        <Kpi label="Payout maisons" value={eur(totalPayout)} />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Aucun drop passé pour l&apos;instant.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>#</th><th className={th}>Drop</th><th className={th}>Statut</th>
                <th className={th}>Reveal</th><th className={th}>Prix clôture</th>
                <th className={th}>Vendus</th><th className={th}>CA brut</th><th className={th}>Payout</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.drop_id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                  <td className={`${td} text-muted-foreground`}>{d.drop_number}</td>
                  <td className={`${td} font-medium`}>
                    <Link href={`/admin/produits/${d.drop_id}`} className="hover:text-[var(--champagne)]">{d.title}</Link>
                  </td>
                  <td className={td}><Badge tone={STATUS_TONE[d.status]}>{STATUS_FR[d.status]}</Badge></td>
                  <td className={`${td} text-muted-foreground`}>{dateShort(d.reveal_at)}</td>
                  <td className={td}>{eur(d.clearing_price_cents)}</td>
                  <td className={td}>{d.status === "revealed" ? `${d.units_sold ?? 0}/${d.exemplaires}` : "—"}</td>
                  <td className={td}>{eur(d.gross_cents)}</td>
                  <td className={td}>{eur(d.payout_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
