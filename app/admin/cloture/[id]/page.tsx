import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Kpi } from "@/lib/admin/ui";
import { eur, dateTime } from "@/lib/admin/format";
import { STATUS_FR, STATUS_TONE, type DropStatus } from "@/lib/admin/drops";
import {
  AUTH_FR, AUTH_TONE, BID_FR, BID_TONE, closeOverdue, runSummary, settlement,
  type AuthStatus, type BidStatus, type RunReport,
} from "@/lib/admin/cloture";
import { RelanceForm } from "../RelanceForm";
import { PrivilegeForm } from "../PrivilegeForm";

export const dynamic = "force-dynamic";

const th = "px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-4 py-3 align-middle";
const dl = "text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";

type BidRow = {
  id: string;
  amount_cents: number;
  status: string;
  stripe_auth_status: string;
  stripe_payment_intent_id: string | null;
  submitted_at: string;
  profiles: { email: string; display_name: string | null } | null;
};

const BID_ORDER: Record<string, number> = { won: 0, lost: 1, withdrawn: 2, invalid: 3, active: 4 };

export default async function ClotureDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const nowMs = Date.now();

  const { data: drop } = await supabase
    .from("drops")
    .select("id, drop_number, title, status, reveal_at, revealed_at, exemplaires, floor_price_cents, clearing_price_cents, bid_count, brands(name)")
    .eq("id", params.id)
    .maybeSingle();
  if (!drop) notFound();

  const status = drop.status as DropStatus;
  const settled = status === "revealed" || status === "cancelled";
  const overdue = closeOverdue(status, drop.reveal_at, nowMs);

  const [bidsRes, runsRes, txRes, offerRes] = await Promise.all([
    supabase
      .from("bids")
      .select("id, amount_cents, status, stripe_auth_status, stripe_payment_intent_id, submitted_at, profiles(email, display_name)")
      .eq("drop_id", drop.id),
    supabase
      .from("drop_close_runs")
      .select("id, ok, close_status, triggered_by, report, created_at")
      .eq("drop_id", drop.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("transactions").select("id, bid_id, status").eq("drop_id", drop.id),
    // Privilège № 001 (RLS : platform admin en lecture).
    supabase
      .from("serial_offers")
      .select("id, status, supplement_cents, expires_at, resolved_at, stripe_payment_intent_id, user_id")
      .eq("drop_id", drop.id)
      .maybeSingle(),
  ]);

  const bids = ((bidsRes.data ?? []) as unknown as BidRow[]).sort(
    (a, b) => (BID_ORDER[a.status] ?? 9) - (BID_ORDER[b.status] ?? 9) || b.amount_cents - a.amount_cents
  );
  const runs = runsRes.data ?? [];
  const txByBid = new Map((txRes.data ?? []).map((t) => [t.bid_id, t]));

  const s = settlement(bids);
  const winners = bids.filter((b) => b.status === "won").length;
  const canRelance = settled || overdue;
  const offer = offerRes.data;

  const OFFER_FR: Record<string, string> = {
    pending: "En attente de réponse",
    accepted: "Acceptée",
    declined: "Déclinée",
    expired: "Expirée",
    refunded: "Remboursée",
  };
  const OFFER_TONE: Record<string, "green" | "amber" | "zinc" | "red" | "champagne"> = {
    pending: "amber",
    accepted: "green",
    declined: "zinc",
    expired: "zinc",
    refunded: "red",
  };

  return (
    <>
      <Link href="/admin/cloture" className="text-sm text-muted-foreground hover:text-foreground">← Clôture</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">
          Clôture · № {String(drop.drop_number).padStart(3, "0")} {drop.title}
        </h1>
        <Badge tone={STATUS_TONE[status]}>{STATUS_FR[status]}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {drop.brands?.name} · reveal {dateTime(drop.reveal_at)} · {drop.exemplaires} exemplaire(s) · plancher {eur(drop.floor_price_cents)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Prix de clôture" value={eur(drop.clearing_price_cents)} />
        <Kpi label="Gagnants" value={settled ? `${winners}/${drop.exemplaires}` : "—"} />
        <Kpi
          label="Captures"
          value={
            settled ? (
              <span className={s.capturesFailed + s.capturesPending > 0 ? "text-red-300" : ""}>
                {s.captured}/{s.captured + s.capturesFailed + s.capturesPending}
              </span>
            ) : "—"
          }
        />
        <Kpi
          label="Pré-auths relâchées"
          value={
            settled ? (
              <span className={s.releasesPending > 0 ? "text-amber-300" : ""}>
                {s.released}/{s.released + s.releasesPending}
              </span>
            ) : "—"
          }
        />
      </div>

      {/* Bandeau d'action */}
      {(canRelance || !settled) && (
        <Card className="mt-4">
          {overdue ? (
            <>
              <h3 className="font-display text-xl text-red-300">Reveal dépassé — clôture non aboutie</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Le cron n&apos;a pas (encore) clôturé ce drop. La relance exécute close_drop + captures/releases Stripe.
                Idempotente : safe même si le cron passe en parallèle.
              </p>
              <div className="mt-3"><RelanceForm dropId={drop.id} /></div>
            </>
          ) : settled && s.needsAction ? (
            <>
              <h3 className="font-display text-xl text-red-300">Règlement incomplet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {s.capturesFailed + s.capturesPending > 0 && `${s.capturesFailed + s.capturesPending} capture(s) gagnant(s) à régler. `}
                {s.releasesPending > 0 && `${s.releasesPending} pré-autorisation(s) à relâcher. `}
                La relance ne retente que ce qui a échoué — les bids déjà réglés sont skip.
              </p>
              <div className="mt-3"><RelanceForm dropId={drop.id} /></div>
            </>
          ) : settled ? (
            <>
              <h3 className="font-display text-xl">Règlement complet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Toutes les captures et releases Stripe sont passées. Relance possible (no-op, tout sera skip).
              </p>
              <div className="mt-3"><RelanceForm dropId={drop.id} /></div>
            </>
          ) : (
            <>
              <h3 className="font-display text-xl">Enchère en cours</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {drop.bid_count} bid(s) actifs. La clôture se déclenchera automatiquement au reveal ({dateTime(drop.reveal_at)}).
                Les bids individuels et le règlement apparaîtront ici après le reveal.
              </p>
            </>
          )}
        </Card>
      )}

      {/* Règlement par enchère — post-résolution uniquement */}
      {settled && (
        <>
          <h2 className="mt-6 font-display text-xl">Règlement par enchère</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
            {bids.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Aucune enchère sur ce drop.</div>
            ) : (
              <table className="w-full min-w-[680px] text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className={th}>Client</th>
                    <th className={th}>Offre</th>
                    <th className={th}>Résultat</th>
                    <th className={th}>Stripe</th>
                    <th className={th}>Commande</th>
                    <th className={th}>PaymentIntent</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b) => {
                    const tx = txByBid.get(b.id);
                    const needs =
                      (b.status === "won" && b.stripe_auth_status !== "captured" && b.stripe_payment_intent_id) ||
                      (b.status !== "won" && (b.stripe_auth_status === "authorized" || b.stripe_auth_status === "failed") && b.stripe_payment_intent_id);
                    return (
                      <tr key={b.id} className={`border-b border-border/60 last:border-0 ${needs ? "bg-red-500/5" : "hover:bg-white/[0.02]"}`}>
                        <td className={`${td} font-medium`}>
                          {b.profiles?.display_name ?? b.profiles?.email ?? "—"}
                          {b.profiles?.display_name && (
                            <span className="ml-2 text-xs text-muted-foreground">{b.profiles.email}</span>
                          )}
                        </td>
                        <td className={td}>{eur(b.amount_cents)}</td>
                        <td className={td}><Badge tone={BID_TONE[b.status as BidStatus]}>{BID_FR[b.status as BidStatus]}</Badge></td>
                        <td className={td}>
                          {b.stripe_payment_intent_id ? (
                            <Badge tone={AUTH_TONE[b.stripe_auth_status as AuthStatus]}>{AUTH_FR[b.stripe_auth_status as AuthStatus]}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sans PI</span>
                          )}
                        </td>
                        <td className={td}>
                          {tx ? (
                            <Link href={`/admin/commandes/${tx.id}`} className="text-xs underline-offset-2 hover:text-[var(--champagne)] hover:underline">
                              {tx.status} →
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className={`${td} font-mono text-[11px] text-muted-foreground`}>{b.stripe_payment_intent_id ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Privilège № 001 — visible admin uniquement (jamais maison) */}
      {settled && (
        <>
          <h2 className="mt-6 font-display text-xl">Privilège № 001</h2>
          <Card className="mt-3 p-4">
            {!offer ? (
              <p className="text-sm text-muted-foreground">
                Aucune offre émise sur ce drop (spread nul, ex aequo en tête, capture du top bid non aboutie, ou drop annulé).
              </p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <Badge tone={OFFER_TONE[offer.status] ?? "zinc"}>{OFFER_FR[offer.status] ?? offer.status}</Badge>
                  <span>Supplément {eur(offer.supplement_cents)}</span>
                  <span className="text-xs text-muted-foreground">
                    {offer.status === "pending"
                      ? `expire ${dateTime(offer.expires_at)}`
                      : offer.resolved_at
                        ? `résolue ${dateTime(offer.resolved_at)}`
                        : ""}
                  </span>
                  {offer.stripe_payment_intent_id && (
                    <span className="font-mono text-[11px] text-muted-foreground">{offer.stripe_payment_intent_id}</span>
                  )}
                </div>
                {offer.status === "pending" && <PrivilegeForm offerId={offer.id} dropId={drop.id} />}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Historique des runs */}
      <h2 className="mt-6 font-display text-xl">Runs de clôture</h2>
      <div className="mt-3 space-y-2">
        {runs.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Aucun run enregistré. (Les rapports sont persistés depuis la v2 de l&apos;edge function — les clôtures antérieures n&apos;apparaissent pas.)
          </Card>
        ) : (
          runs.map((r) => {
            const report = (r.report ?? {}) as RunReport;
            const errors = report.errors ?? [];
            return (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge tone={r.ok ? "green" : "red"}>{r.ok ? "OK" : "Erreurs"}</Badge>
                    <Badge tone={r.triggered_by === "admin" ? "violet" : "zinc"}>
                      {r.triggered_by === "admin" ? "Relance manuelle" : "Cron"}
                    </Badge>
                    {r.close_status && <span className="text-xs text-muted-foreground">→ {r.close_status}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{dateTime(r.created_at)}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{runSummary(report)}</p>
                {errors.length > 0 && (
                  <details className="mt-2">
                    <summary className={`${dl} cursor-pointer`}>Détail des {errors.length} erreur(s)</summary>
                    <ul className="mt-2 space-y-1">
                      {errors.map((e, i) => (
                        <li key={i} className="font-mono text-[11px] text-red-300">
                          [{e.action}] bid {e.bid_id} — {e.message}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
