import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Kpi, PageHeader } from "@/lib/admin/ui";
import { eur, dateTime } from "@/lib/admin/format";
import { STATUS_FR, STATUS_TONE, type DropStatus } from "@/lib/admin/drops";
import {
  cronHealthy, cronLabel, closeOverdue, settlement,
  type CronHealth, type SettleBid,
} from "@/lib/admin/cloture";

export const dynamic = "force-dynamic";

const th = "px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-4 py-3 align-middle";

type DropRow = {
  id: string;
  drop_number: number;
  title: string;
  status: string;
  reveal_at: string;
  exemplaires: number;
  clearing_price_cents: number | null;
  bid_count: number;
  brands: { name: string } | null;
};

export default async function CloturePage() {
  const supabase = createClient();
  const nowMs = Date.now();

  const [cronRes, dropsRes] = await Promise.all([
    supabase.rpc("get_cron_health"),
    supabase
      .from("drops")
      .select("id, drop_number, title, status, reveal_at, exemplaires, clearing_price_cents, bid_count, brands(name)")
      .in("status", ["open", "closed", "revealed", "cancelled"])
      .order("reveal_at", { ascending: false })
      .limit(20),
  ]);

  const crons = (cronRes.data ?? []) as unknown as CronHealth[];
  const drops = (dropsRes.data ?? []) as unknown as DropRow[];
  const ids = drops.map((d) => d.id);

  const [bidsRes, runsRes] = await Promise.all([
    ids.length
      ? supabase.from("bids").select("drop_id, status, stripe_auth_status, stripe_payment_intent_id").in("drop_id", ids)
      : Promise.resolve({ data: [] as (SettleBid & { drop_id: string })[] }),
    ids.length
      ? supabase.from("drop_close_runs").select("drop_id, ok, created_at, triggered_by").in("drop_id", ids).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { drop_id: string; ok: boolean; created_at: string; triggered_by: string }[] }),
  ]);

  const bidsByDrop = new Map<string, SettleBid[]>();
  for (const b of (bidsRes.data ?? []) as (SettleBid & { drop_id: string })[]) {
    const list = bidsByDrop.get(b.drop_id) ?? [];
    list.push(b);
    bidsByDrop.set(b.drop_id, list);
  }
  const lastRun = new Map<string, { ok: boolean; created_at: string; triggered_by: string }>();
  for (const r of (runsRes.data ?? []) as { drop_id: string; ok: boolean; created_at: string; triggered_by: string }[]) {
    if (!lastRun.has(r.drop_id)) lastRun.set(r.drop_id, r);
  }

  // État de règlement par drop
  const rows = drops.map((d) => {
    const settled = d.status === "revealed" || d.status === "cancelled";
    const s = settlement(bidsByDrop.get(d.id) ?? []);
    const overdue = closeOverdue(d.status, d.reveal_at, nowMs);
    const needsAction = overdue || (settled && s.needsAction);
    return { d, s, settled, overdue, needsAction, run: lastRun.get(d.id) };
  });

  const aTraiter = rows.filter((r) => r.needsAction);
  const capturesKo = rows.reduce((n, r) => n + (r.settled ? r.s.capturesFailed + r.s.capturesPending : 0), 0);
  const releasesKo = rows.reduce((n, r) => n + (r.settled ? r.s.releasesPending : 0), 0);
  const cronsOk = crons.filter(cronHealthy).length;

  return (
    <>
      <PageHeader
        title="Clôture"
        subtitle="Pilotage des reveals : captures gagnants, releases perdants, santé des automatismes."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Drops à traiter" value={aTraiter.length} />
        <Kpi label="Captures en attente / échec" value={capturesKo} />
        <Kpi label="Pré-auths à relâcher" value={releasesKo} />
        <Kpi label="Automatismes sains" value={`${cronsOk}/${crons.length || "—"}`} />
      </div>

      {/* Santé des crons */}
      <h2 className="mt-7 font-display text-xl">Automatismes</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {crons.map((c) => (
          <Card key={c.jobname} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{cronLabel(c.jobname)}</span>
              <Badge tone={cronHealthy(c) ? "green" : "red"}>
                {!c.active ? "Inactif" : cronHealthy(c) ? "OK" : "Échec"}
              </Badge>
            </div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div>Dernier run : {dateTime(c.last_run_at)} {c.last_status ? `· ${c.last_status === "succeeded" ? "réussi" : "échec"}` : ""}</div>
              <div>Échecs 24h : <span className={c.failures_24h > 0 ? "font-semibold text-red-300" : ""}>{c.failures_24h}</span></div>
              {c.failures_24h > 0 && c.last_message && (
                <div className="truncate font-mono text-[11px]" title={c.last_message}>{c.last_message}</div>
              )}
            </div>
          </Card>
        ))}
        {crons.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground sm:col-span-3">Santé des crons indisponible.</Card>
        )}
      </div>

      {/* À traiter en priorité */}
      {aTraiter.length > 0 && (
        <>
          <h2 className="mt-7 font-display text-xl text-red-300">Action requise</h2>
          <div className="mt-3 space-y-2">
            {aTraiter.map(({ d, s, overdue }) => (
              <Link
                key={d.id}
                href={`/admin/cloture/${d.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 transition-colors hover:bg-red-500/10"
              >
                <div className="text-sm font-medium">
                  № {String(d.drop_number).padStart(3, "0")} · {d.title}
                  <span className="ml-2 text-xs text-muted-foreground">{d.brands?.name}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {overdue && <Badge tone="red">Reveal dépassé · clôture en attente</Badge>}
                  {s.capturesFailed + s.capturesPending > 0 && (
                    <Badge tone="red">{s.capturesFailed + s.capturesPending} capture(s) à régler</Badge>
                  )}
                  {s.releasesPending > 0 && <Badge tone="amber">{s.releasesPending} pré-auth(s) à relâcher</Badge>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Tous les drops actifs/passés récents */}
      <h2 className="mt-7 font-display text-xl">Drops récents</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Aucun drop ouvert ou clôturé.</div>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Drop</th>
                <th className={th}>Statut</th>
                <th className={th}>Reveal</th>
                <th className={th}>Prix clôture</th>
                <th className={th}>Règlement</th>
                <th className={th}>Dernier run</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ d, s, settled, overdue, run }) => (
                <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                  <td className={`${td} text-muted-foreground`}>{d.drop_number}</td>
                  <td className={`${td} font-medium`}>
                    <Link href={`/admin/cloture/${d.id}`} className="hover:text-[var(--champagne)]">
                      {d.title}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">{d.brands?.name}</span>
                  </td>
                  <td className={td}><Badge tone={STATUS_TONE[d.status as DropStatus]}>{STATUS_FR[d.status as DropStatus]}</Badge></td>
                  <td className={`${td} text-muted-foreground`}>{dateTime(d.reveal_at)}</td>
                  <td className={td}>{eur(d.clearing_price_cents)}</td>
                  <td className={td}>
                    {overdue ? (
                      <Badge tone="red">En attente</Badge>
                    ) : !settled ? (
                      <span className="text-xs text-muted-foreground">{d.bid_count} bid(s) · en cours</span>
                    ) : s.needsAction ? (
                      <Badge tone="red">Action requise</Badge>
                    ) : (
                      <Badge tone="green">Réglé</Badge>
                    )}
                  </td>
                  <td className={`${td} text-xs text-muted-foreground`}>
                    {run ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${run.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                        {dateTime(run.created_at)} · {run.triggered_by === "admin" ? "manuel" : "cron"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
