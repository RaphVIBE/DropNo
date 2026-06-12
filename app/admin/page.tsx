import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, Kpi, Card } from "@/lib/admin/ui";
import { eur, dateTime, dateShort } from "@/lib/admin/format";
import { STATUS_FR, STATUS_TONE, isPlannable, type DropStatus } from "@/lib/admin/drops";
import {
  analyticsConfigured, getDropViewTotals, getTrafficSeries, getTrafficTotals,
} from "@/lib/analytics/posthog";
import { AnalyticsNotConfigured, Sparkline } from "@/components/admin/analytics";
import { shiftDrop } from "./produits/actions";
import { AdminTabs } from "@/components/admin/tabs";

export const dynamic = "force-dynamic";

type Upcoming = {
  id: string; drop_number: number; title: string; status: DropStatus;
  bid_window_opens_at: string; reveal_at: string; exemplaires: number; floor_price_cents: number;
  brands: { name: string } | null;
};

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export default async function AdminHome() {
  const supabase = createClient();

  const [{ count: brands }, { count: drops }, { count: users }, { count: bids }] = await Promise.all([
    supabase.from("brands").select("*", { count: "exact", head: true }),
    supabase.from("drops").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("bids").select("*", { count: "exact", head: true }),
  ]);

  // Drop en cours (le plus proche du reveal).
  const { data: open } = await supabase
    .from("drops")
    .select("id, drop_number, title, exemplaires, floor_price_cents, reveal_at, brands(name)")
    .eq("status", "open")
    .order("reveal_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Prix de clôture provisoire = N-ième offre qualifiée (N = exemplaires),
  // soit la plus basse parmi les N meilleures ≥ plancher (logique close_drop).
  let bidCount = 0;
  let provisional: number | null = null;
  if (open) {
    const { count } = await supabase
      .from("bids").select("*", { count: "exact", head: true })
      .eq("drop_id", open.id).eq("status", "active");
    bidCount = count ?? 0;

    const { data: top } = await supabase
      .from("bids").select("amount_cents")
      .eq("drop_id", open.id).eq("status", "active")
      .gte("amount_cents", open.floor_price_cents)
      .order("amount_cents", { ascending: false })
      .limit(open.exemplaires);
    provisional = top && top.length ? top[top.length - 1].amount_cents : null;
  }

  // Audience (PostHog) : pouls 7 jours + vues du drop en cours.
  const configured = analyticsConfigured();
  const [traffic7, series14, openViews] = configured
    ? await Promise.all([
        getTrafficTotals(7),
        getTrafficSeries(14),
        open ? getDropViewTotals(open.id, 30) : Promise.resolve(null),
      ])
    : [null, null, null];
  const openConversion =
    openViews && openViews.uniques > 0 ? Math.round((bidCount / openViews.uniques) * 100) : null;

  // Calendrier : drops à venir / en cours.
  const { data: up } = await supabase
    .from("drops")
    .select("id, drop_number, title, status, bid_window_opens_at, reveal_at, exemplaires, floor_price_cents, brands(name)")
    .in("status", ["draft", "scheduled", "open"])
    .order("bid_window_opens_at", { ascending: true });
  const upcoming = (up ?? []) as unknown as Upcoming[];

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Vue d&apos;ensemble</h1>
        <AdminTabs />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Maisons" value={brands ?? 0} />
        <Kpi label="Drops" value={drops ?? 0} />
        <Kpi label="Comptes" value={users ?? 0} />
        <Kpi label="Enchères" value={bids ?? 0} />
      </div>

      {/* Drop en cours */}
      <h2 className="mb-2 mt-7 font-display text-xl">Drop en cours</h2>
      {!open ? (
        <Card className="text-sm text-muted-foreground">Aucun drop ouvert actuellement.</Card>
      ) : (
        <Card className="border-emerald-500/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link href={`/admin/produits/${open.id}`} className="font-display text-2xl hover:text-[var(--champagne)]">№ {open.drop_number} · {open.title}</Link>
              <div className="text-xs text-muted-foreground">{open.brands?.name} · {open.exemplaires} exemplaires · plancher {eur(open.floor_price_cents)}</div>
            </div>
            <Badge tone="green">Ouvert</Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Enchères posées" value={bidCount} />
            <Stat label={`Prix provisoire (${open.exemplaires}ᵉ)`} value={eur(provisional)} accent />
            <Stat label="Demande" value={`${open.exemplaires ? Math.round((bidCount / open.exemplaires) * 100) : 0}%`} />
            <Stat label="Reveal" value={`${dateShort(open.reveal_at)} · J−${Math.max(0, daysUntil(open.reveal_at))}`} />
            {openViews && (
              <>
                <Stat label="Vues de la pièce · 30j" value={openViews.views} />
                <Stat label="Visiteurs · 30j" value={openViews.uniques} />
                <Stat label="Conversion vue → bid" value={openConversion != null ? `${openConversion}%` : "—"} accent />
              </>
            )}
          </div>
          {provisional == null && bidCount > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Aucune offre n&apos;atteint encore le plancher.</p>
          )}
        </Card>
      )}

      {/* Audience */}
      <div className="mb-2 mt-7 flex items-center justify-between">
        <h2 className="font-display text-xl">Audience</h2>
        <Link href="/admin/audience" className="text-xs text-muted-foreground hover:text-foreground">
          Tout voir →
        </Link>
      </div>
      {!configured ? (
        <AnalyticsNotConfigured compact />
      ) : (
        <Card>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <Stat label="Visiteurs uniques · 7j" value={traffic7?.uniques ?? "—"} />
            <Stat label="Pages vues · 7j" value={traffic7?.views ?? "—"} />
            <div className="min-w-[200px] flex-1">
              {series14 && series14.length > 1 ? (
                <Sparkline series={series14} height={48} />
              ) : (
                <span className="text-xs text-muted-foreground">Pas encore de trafic.</span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Calendrier */}
      <div className="mb-2 mt-7 flex items-center justify-between">
        <h2 className="font-display text-xl">Calendrier</h2>
        <Button asChild size="sm" className="hover:bg-[oklch(0.78_0.075_82)]">
          <Link href="/admin/produits/new"><Plus className="h-4 w-4" /> Nouveau drop</Link>
        </Button>
      </div>
      {upcoming.length === 0 ? (
        <Card className="text-sm text-muted-foreground">Aucun drop à venir. Crée le premier.</Card>
      ) : (
        <div className="space-y-2">
          {upcoming.map((d) => (
            <Card key={d.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-3.5">
              <div className="w-10 shrink-0 text-center font-display text-2xl text-muted-foreground">{d.drop_number}</div>
              <div className="min-w-[160px] flex-1">
                <Link href={`/admin/produits/${d.id}`} className="font-medium hover:text-[var(--champagne)]">{d.title}</Link>
                <div className="text-xs text-muted-foreground">{d.brands?.name}</div>
              </div>
              <Badge tone={STATUS_TONE[d.status]}>{STATUS_FR[d.status]}</Badge>
              <div className="text-xs text-muted-foreground">
                <div>Ouvre&nbsp;: <span className="text-foreground/80">{dateTime(d.bid_window_opens_at)}</span></div>
                <div>Reveal&nbsp;: <span className="text-foreground/80">{dateTime(d.reveal_at)}</span></div>
              </div>
              {isPlannable(d.status) ? (
                <div className="flex items-center gap-1">
                  <ShiftBtn id={d.id} days={-7} label="−7j" />
                  <ShiftBtn id={d.id} days={-1} label="−1j" />
                  <ShiftBtn id={d.id} days={1} label="+1j" />
                  <ShiftBtn id={d.id} days={7} label="+7j" />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">verrouillé</span>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${accent ? "text-[var(--champagne)]" : ""}`}>{value}</div>
    </div>
  );
}

function ShiftBtn({ id, days, label }: { id: string; days: number; label: string }) {
  return (
    <form action={shiftDrop}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="days" value={days} />
      <button
        type="submit"
        title={`Décaler de ${days > 0 ? "+" : ""}${days} jour(s)`}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
      >
        {days < 0 ? <ArrowLeft className="h-3 w-3" /> : null}
        {label}
        {days > 0 ? <ArrowRight className="h-3 w-3" /> : null}
      </button>
    </form>
  );
}
