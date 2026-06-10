import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/lib/admin/ui";
import { eur, dateTime } from "@/lib/admin/format";
import {
  TX_FR, TX_TONE, DELIVERY_FR, DELIVERY_TONE, CARRIERS, carrierLabel, NEXT_DELIVERY,
  type TxStatus, type DeliveryStatus,
} from "@/lib/admin/orders";
import { createDelivery, advanceDelivery, updateTracking } from "../actions";

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

  const delivery = ((t.deliveries as unknown as Record<string, unknown>[]) ?? [])[0] as
    | Record<string, unknown>
    | undefined;
  const status = t.status as TxStatus;

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

      <Card className="mt-4">
        <h3 className="font-display text-xl">Livraison sécurisée</h3>
        {!delivery ? (
          <form action={createDelivery} className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="transaction_id" value={t.id} />
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
            <Button type="submit" className="hover:bg-[oklch(0.78_0.075_82)]">Créer la livraison</Button>
          </form>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-6">
              <div><div className={dl}>Statut</div><div className="mt-1"><Badge tone={DELIVERY_TONE[delivery.status as DeliveryStatus]}>{DELIVERY_FR[delivery.status as DeliveryStatus]}</Badge></div></div>
              <div><div className={dl}>Transporteur</div><div className={dd}>{carrierLabel(delivery.carrier as string)}</div></div>
              <div><div className={dl}>Suivi</div><div className={dd}>{(delivery.tracking_number as string) ?? "—"}</div></div>
              <div><div className={dl}>Expédiée</div><div className={dd}>{dateTime(delivery.shipped_at as string)}</div></div>
              <div><div className={dl}>Livrée</div><div className={dd}>{dateTime(delivery.delivered_at as string)}</div></div>
            </div>

            {(NEXT_DELIVERY[delivery.status as DeliveryStatus] ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={dl}>Avancer →</span>
                {NEXT_DELIVERY[delivery.status as DeliveryStatus].map((next) => (
                  <form key={next} action={advanceDelivery}>
                    <input type="hidden" name="id" value={delivery.id as string} />
                    <input type="hidden" name="transaction_id" value={t.id} />
                    <input type="hidden" name="status" value={next} />
                    <Button type="submit" variant="outline" size="sm">{DELIVERY_FR[next]}</Button>
                  </form>
                ))}
              </div>
            )}

            <form action={updateTracking} className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
              <input type="hidden" name="id" value={delivery.id as string} />
              <input type="hidden" name="transaction_id" value={t.id} />
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
              <Button type="submit" variant="outline">Mettre à jour le suivi</Button>
            </form>
          </>
        )}
      </Card>

      {status === "captured" && (
        <p className="mt-4 text-xs text-muted-foreground">
          Remboursement : action financière sensible — à déclencher manuellement côté Stripe (non exécuté depuis le back-office par sécurité).
        </p>
      )}
    </>
  );
}
