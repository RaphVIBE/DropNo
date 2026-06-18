import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/lib/admin/ui";
import { STATUS_FR, STATUS_TONE, canPublish, canCancel, canDelete, nextRevealSlots, type DropStatus } from "@/lib/admin/drops";
import { eur, dateTime } from "@/lib/admin/format";
import {
  analyticsConfigured, getDropViewSeries, getDropViewTotals, getTopCountries,
} from "@/lib/analytics/posthog";
import { AnalyticsEmpty, BarList, Sparkline } from "@/components/admin/analytics";
import { DropForm, type Drop } from "../DropForm";
import { publishDrop, cancelDrop, deleteDrop, saveDrop } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditDropPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: drop }, { data: brands }] = await Promise.all([
    supabase.from("drops").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("brands").select("id, name").order("name"),
  ]);
  if (!drop) notFound();

  const status = drop.status as DropStatus;
  const revealSlots = nextRevealSlots(new Date().toISOString(), 16);

  // Audience de la pièce (PostHog) — uniquement si branché et drop visible.
  const showAudience = analyticsConfigured() && status !== "draft";
  const [views, series, countries] = showAudience
    ? await Promise.all([
        getDropViewTotals(drop.id),
        getDropViewSeries(drop.id, 30),
        getTopCountries(90, drop.id),
      ])
    : [null, null, null];
  const conversion =
    views && views.uniques > 0 ? Math.round((drop.bid_count / views.uniques) * 100) : null;

  return (
    <>
      <Link href="/admin/produits" className="text-sm text-muted-foreground hover:text-foreground">← Produits / Drops</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">№ {drop.drop_number} · {drop.title}</h1>
        <Badge tone={STATUS_TONE[status]}>{STATUS_FR[status]}</Badge>
      </div>

      <Card className="mb-4 mt-4 flex flex-wrap items-center gap-3">
        {canPublish(status) && (
          <form action={publishDrop}>
            <input type="hidden" name="id" value={drop.id} />
            <Button type="submit" className="hover:bg-[oklch(0.78_0.075_82)]">Publier → programmé</Button>
          </form>
        )}
        {status === "revealed" && (
          <span className="text-sm text-muted-foreground">Résultat à {eur(drop.clearing_price_cents)} · révélé le {dateTime(drop.revealed_at)}.</span>
        )}
        {(status === "open" || status === "closed") && (
          <span className="text-sm text-muted-foreground">Enchère en cours · reveal {dateTime(drop.reveal_at)} (clôture automatique).</span>
        )}
        {status === "scheduled" && (
          <span className="text-sm text-muted-foreground">Programmé · ouverture automatique le {dateTime(drop.bid_window_opens_at)}.</span>
        )}
        <span className="flex-1" />
        {canCancel(status) && (
          <form action={cancelDrop}>
            <input type="hidden" name="id" value={drop.id} />
            <Button type="submit" variant="outline">Annuler le drop</Button>
          </form>
        )}
        {canDelete(status) && (
          <form action={deleteDrop}>
            <input type="hidden" name="id" value={drop.id} />
            <Button type="submit" variant="destructiveOutline">Supprimer</Button>
          </form>
        )}
      </Card>

      {showAudience && (
        <Card className="mb-4 max-w-2xl">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-xl">Audience de la pièce</h3>
            <span className="text-xs text-muted-foreground">90 jours · PostHog</span>
          </div>
          {views ? (
            <>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <MiniStat label="Vues" value={views.views} />
                <MiniStat label="Visiteurs" value={views.uniques} />
                <MiniStat
                  label="Conversion vue → bid"
                  value={conversion != null ? `${conversion}%` : "—"}
                  accent
                />
              </div>
              {series && series.length > 1 && (
                <Sparkline series={series} height={56} className="mt-3 h-14 w-full" />
              )}
              {countries && countries.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Top pays</div>
                  <div className="mt-2"><BarList items={countries.slice(0, 5)} /></div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-3"><AnalyticsEmpty label="Pas encore de vues sur cette pièce." /></div>
          )}
        </Card>
      )}

      <Card className="max-w-2xl">
        <DropForm action={saveDrop} brands={brands ?? []} revealSlots={revealSlots} drop={drop as unknown as Drop} status={status} />
      </Card>
    </>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${accent ? "text-[var(--champagne)]" : ""}`}>{value}</div>
    </div>
  );
}
