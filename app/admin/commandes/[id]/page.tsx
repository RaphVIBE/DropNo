import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/lib/admin/ui";
import { eur, dateTime } from "@/lib/admin/format";
import {
  TX_FR, TX_TONE, DELIVERY_TONE, CARRIERS, carrierLabel,
  deliveryLabel, nextDeliverySteps, trackingUrl,
  type TxStatus, type DeliveryStatus, type DeliveryDirection,
} from "@/lib/admin/orders";
import {
  WITHDRAWAL_FR, WITHDRAWAL_TONE, NEXT_WITHDRAWAL, canRefund, canReject, refundRunError,
  type WithdrawalStatus, type RefundRunRow,
} from "@/lib/admin/retractation";
import {
  createDelivery, advanceDelivery, updateTracking,
  creerRetractation, avancerRetractation, refuserRetractation,
} from "../actions";
import { RembourserForm } from "../RembourserForm";

export const dynamic = "force-dynamic";

const dl = "text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const dd = "mt-1 text-sm font-medium";
const field = "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: t } = await supabase
    .from("transactions")
    .select("*, drops(drop_number,title,brands(name)), profiles(email,display_name,kyc_status), bids(amount_cents,submitted_at), deliveries(*)")
    .eq("id", params.id)
    .maybeSingle();
  if (!t) notFound();

  const [{ data: wr }, { data: refundRunsData }] = await Promise.all([
    supabase.from("withdrawal_requests").select("*").eq("transaction_id", params.id).maybeSingle(),
    supabase
      .from("refund_runs")
      .select("id, ok, stripe_refund_id, amount_cents, report, created_at")
      .eq("transaction_id", params.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const refundRuns = (refundRunsData ?? []) as RefundRunRow[];

  const deliveries = (t.deliveries as unknown as Record<string, unknown>[]) ?? [];
  const outbound = deliveries.find((d) => d.direction !== "return");
  const retour = deliveries.find((d) => d.direction === "return");
  const status = t.status as TxStatus;
  const wrStatus = wr?.status as WithdrawalStatus | undefined;
  const windowEnds = t.withdrawal_window_ends_at;
  const windowPassed = !!windowEnds && new Date(windowEnds).getTime() < Date.now();

  return (
    <>
      <Link href="/admin/commandes" className="text-sm text-muted-foreground hover:text-foreground">← Commandes</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Commande · № {t.drops?.drop_number} {t.drops?.title}</h1>
        <Badge tone={TX_TONE[status]}>{TX_FR[status]}</Badge>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-display text-xl">Paiement</h3>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            <div><div className={dl}>Montant payé (clôture)</div><div className={dd}>{eur(t.amount_paid_cents)}</div></div>
            <div><div className={dl}>Commission</div><div className={dd}>{eur(t.platform_fee_cents)}</div></div>
            <div><div className={dl}>Payout maison</div><div className={dd}>{eur(t.brand_payout_cents)}</div></div>
            <div><div className={dl}>Rétractation jusqu&apos;au</div><div className={dd}>{dateTime(t.withdrawal_window_ends_at)}</div></div>
            <div><div className={dl}>Capturé le</div><div className={dd}>{dateTime(t.captured_at)}</div></div>
            <div><div className={dl}>Stripe charge</div><div className="mt-1 font-mono text-xs">{t.stripe_charge_id ?? "—"}</div></div>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-xl">Client</h3>
          <div className="mt-3 space-y-3">
            <div><div className={dl}>Nom</div><div className={dd}>{t.profiles?.display_name ?? "—"}</div></div>
            <div><div className={dl}>Email</div><div className={dd}>{t.profiles?.email ?? "—"}</div></div>
            <div><div className={dl}>KYC</div><div className={dd}>{t.profiles?.kyc_status ?? "—"}</div></div>
            <div><div className={dl}>Maison</div><div className={dd}>{t.drops?.brands?.name ?? "—"}</div></div>
            <div><div className={dl}>Enchère gagnante</div><div className={dd}>{eur(t.bids?.amount_cents)} · {dateTime(t.bids?.submitted_at)}</div></div>
          </div>
        </Card>
      </div>

      <DeliveryBlock
        txId={t.id}
        delivery={outbound}
        direction="outbound"
        title="Livraison sécurisée"
        defaultInsuredCents={t.amount_paid_cents}
      />

      {((wr && wrStatus !== "rejected") || retour) && (
        <DeliveryBlock
          txId={t.id}
          delivery={retour}
          direction="return"
          title="Retour sécurisé"
          hint="Flux inverse de la rétractation : étiquette/enlèvement, dépôt client, transit, réception pour inspection."
          defaultInsuredCents={t.amount_paid_cents}
        />
      )}

      {/* Rétractation 14j + remboursement */}
      {(status === "captured" || status === "refunded" || wr) && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl">Rétractation & remboursement</h3>
            {wrStatus ? (
              <Badge tone={WITHDRAWAL_TONE[wrStatus]}>{WITHDRAWAL_FR[wrStatus]}</Badge>
            ) : status === "refunded" ? (
              <Badge tone="green">Remboursée</Badge>
            ) : null}
          </div>

          {status === "refunded" && !wr && (
            <p className="mt-2 text-sm text-muted-foreground">Commande remboursée (hors workflow rétractation).</p>
          )}

          {!wr && status === "captured" && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Fenêtre légale : jusqu&apos;au {dateTime(windowEnds)}.
                {windowPassed && (
                  <span className="ml-2 text-amber-300">Délai 14 j dépassé — toute acceptation est un geste commercial.</span>
                )}
              </p>
              <form action={creerRetractation} className="mt-3 flex flex-wrap items-end gap-3">
                <input type="hidden" name="transaction_id" value={t.id} />
                <div className="grow">
                  <div className={dl}>Motif / contexte (optionnel)</div>
                  <input name="reason" className={`${field} mt-1 w-full max-w-md`} placeholder="Demande client du…" />
                </div>
                <Button type="submit" variant="outline">Ouvrir une rétractation</Button>
              </form>
            </>
          )}

          {wr && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
                <div><div className={dl}>Demandée le</div><div className={dd}>{dateTime(wr.requested_at)}</div></div>
                <div><div className={dl}>Fenêtre légale</div><div className={dd}>{dateTime(windowEnds)}</div></div>
                <div><div className={dl}>Motif</div><div className={dd}>{wr.reason ?? "—"}</div></div>
                {wr.status === "refunded" && (
                  <div><div className={dl}>Remboursée le</div><div className={dd}>{dateTime(wr.refunded_at)}</div></div>
                )}
                {wr.status === "rejected" && (
                  <div><div className={dl}>Motif du refus</div><div className={`${dd} text-red-300`}>{wr.rejection_reason}</div></div>
                )}
              </div>

              {(NEXT_WITHDRAWAL[wrStatus!] ?? []).length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={dl}>Avancer →</span>
                  {NEXT_WITHDRAWAL[wrStatus!].map((next) => (
                    <form key={next} action={avancerRetractation}>
                      <input type="hidden" name="id" value={wr.id} />
                      <input type="hidden" name="transaction_id" value={t.id} />
                      <input type="hidden" name="status" value={next} />
                      <Button type="submit" variant="outline" size="sm">{WITHDRAWAL_FR[next]}</Button>
                    </form>
                  ))}
                  <span className="text-xs text-muted-foreground">« Pièce reçue » passe aussi la livraison en retour.</span>
                </div>
              )}

              {canRefund(wrStatus!) && status === "captured" && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-sm text-muted-foreground">
                    Pièce reçue et inspectée ? Le remboursement est intégral ({eur(t.amount_paid_cents)}), via Stripe, irréversible.
                  </p>
                  <RembourserForm transactionId={t.id} amountLabel={eur(t.amount_paid_cents)} />
                </div>
              )}

              {canReject(wrStatus!) && (
                <form action={refuserRetractation} className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
                  <input type="hidden" name="id" value={wr.id} />
                  <input type="hidden" name="transaction_id" value={t.id} />
                  <div className="grow">
                    <div className={dl}>Refuser — motif (obligatoire)</div>
                    <input name="rejection_reason" required className={`${field} mt-1 w-full max-w-md`} placeholder="Pièce retournée endommagée…" />
                  </div>
                  <Button type="submit" variant="ghost" size="sm" className="hover:text-red-300">Refuser la rétractation</Button>
                </form>
              )}
            </>
          )}

          {refundRuns.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <div className={dl}>Tentatives de remboursement</div>
              <ul className="mt-2 space-y-1">
                {refundRuns.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${r.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className="text-muted-foreground">{dateTime(r.created_at)}</span>
                    {r.ok ? (
                      <span>
                        {eur(r.amount_cents)} · <span className="font-mono">{r.stripe_refund_id}</span>
                      </span>
                    ) : (
                      <span className="text-red-300">{refundRunError(r.report) ?? "Échec"}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Bloc livraison (aller ou retour). Mêmes statuts DB, labels par direction :
// côté retour, « delivered » = pièce reçue pour inspection.
// ---------------------------------------------------------------------------
function DeliveryBlock({
  txId, delivery, direction, title, hint, defaultInsuredCents,
}: {
  txId: string;
  delivery?: Record<string, unknown>;
  direction: DeliveryDirection;
  title: string;
  hint?: string;
  defaultInsuredCents: number;
}) {
  const dStatus = delivery?.status as DeliveryStatus | undefined;
  const url = delivery
    ? trackingUrl(delivery.carrier as string, (delivery.tracking_number as string) ?? null)
    : null;
  const insured = delivery?.insured_value_cents as number | null | undefined;

  return (
    <Card className="mt-4">
      <h3 className="font-display text-xl">{title}</h3>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}

      {!delivery ? (
        <form action={createDelivery} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="transaction_id" value={txId} />
          <input type="hidden" name="direction" value={direction} />
          <div>
            <div className={dl}>Transporteur</div>
            <select name="carrier" required defaultValue="" className={`${field} mt-1`}>
              <option value="" disabled>— choisir —</option>
              {CARRIERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <div className={dl}>N° de suivi (optionnel)</div>
            <input name="tracking_number" className={`${field} mt-1`} placeholder="Tracking" />
          </div>
          <div>
            <div className={dl}>Valeur assurée (€)</div>
            <input
              name="insured_value"
              inputMode="decimal"
              defaultValue={(defaultInsuredCents / 100).toFixed(0)}
              className={`${field} mt-1 w-28`}
            />
          </div>
          <Button type="submit" className="hover:bg-[oklch(0.78_0.075_82)]">
            {direction === "return" ? "Organiser le retour" : "Créer la livraison"}
          </Button>
        </form>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <div>
              <div className={dl}>Statut</div>
              <div className="mt-1">
                <Badge tone={DELIVERY_TONE[dStatus!]}>{deliveryLabel(direction, dStatus!)}</Badge>
              </div>
            </div>
            <div><div className={dl}>Transporteur</div><div className={dd}>{carrierLabel(delivery.carrier as string)}</div></div>
            <div>
              <div className={dl}>Suivi</div>
              <div className={dd}>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-[var(--champagne)] hover:underline">
                    {delivery.tracking_number as string} ↗
                  </a>
                ) : (
                  ((delivery.tracking_number as string) ?? "—")
                )}
              </div>
            </div>
            <div><div className={dl}>Valeur assurée</div><div className={dd}>{eur(insured ?? null)}</div></div>
            <div><div className={dl}>{direction === "return" ? "Déposée" : "Expédiée"}</div><div className={dd}>{dateTime(delivery.shipped_at as string)}</div></div>
            <div><div className={dl}>{direction === "return" ? "Reçue" : "Livrée"}</div><div className={dd}>{dateTime(delivery.delivered_at as string)}</div></div>
          </div>

          {nextDeliverySteps(direction, dStatus!).length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={dl}>Avancer →</span>
              {nextDeliverySteps(direction, dStatus!).map((next) => (
                <form key={next} action={advanceDelivery}>
                  <input type="hidden" name="id" value={delivery.id as string} />
                  <input type="hidden" name="transaction_id" value={txId} />
                  <input type="hidden" name="status" value={next} />
                  <Button type="submit" variant="outline" size="sm">{deliveryLabel(direction, next)}</Button>
                </form>
              ))}
            </div>
          )}

          <form action={updateTracking} className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
            <input type="hidden" name="id" value={delivery.id as string} />
            <input type="hidden" name="transaction_id" value={txId} />
            <div>
              <div className={dl}>Transporteur</div>
              <select name="carrier" defaultValue={delivery.carrier as string} className={`${field} mt-1`}>
                {CARRIERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <div className={dl}>N° de suivi</div>
              <input name="tracking_number" defaultValue={(delivery.tracking_number as string) ?? ""} className={`${field} mt-1`} />
            </div>
            <div>
              <div className={dl}>Valeur assurée (€)</div>
              <input
                name="insured_value"
                inputMode="decimal"
                defaultValue={insured != null ? (insured / 100).toFixed(0) : ""}
                className={`${field} mt-1 w-28`}
              />
            </div>
            <Button type="submit" variant="outline">Mettre à jour</Button>
          </form>
        </>
      )}
    </Card>
  );
}
