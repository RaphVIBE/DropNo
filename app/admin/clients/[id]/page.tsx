import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/lib/admin/ui";
import { eur, dateTime } from "@/lib/admin/format";
import { KYC_FR, KYC_TONE, type KycStatus } from "@/lib/admin/clients";
import { STATUS_FR as DROP_FR, STATUS_TONE as DROP_TONE, type DropStatus } from "@/lib/admin/drops";
import { TX_FR, TX_TONE, DELIVERY_FR, DELIVERY_TONE, type TxStatus, type DeliveryStatus } from "@/lib/admin/orders";

export const dynamic = "force-dynamic";

const dl = "text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const dd = "mt-1 text-sm font-medium";
const th = "px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-3 py-2.5 align-middle";

export default async function ClientDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: p } = await supabase.from("profiles").select("*").eq("id", params.id).maybeSingle();
  if (!p) notFound();

  const [{ data: bids }, { data: txs }] = await Promise.all([
    supabase.from("bids").select("id, amount_cents, status, submitted_at, drops(drop_number,title,status)").eq("user_id", params.id).order("submitted_at", { ascending: false }),
    supabase.from("transactions").select("id, amount_paid_cents, status, created_at, drops(drop_number,title), deliveries(status)").eq("user_id", params.id).order("created_at", { ascending: false }),
  ]);
  const kyc = p.kyc_status as KycStatus;

  return (
    <>
      <Link href="/admin/clients" className="text-sm text-muted-foreground hover:text-foreground">← Clients</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{p.display_name ?? p.email}</h1>
        <Badge tone={KYC_TONE[kyc]}>KYC · {KYC_FR[kyc]}</Badge>
      </div>

      <Card className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
        <div><div className={dl}>Email</div><div className={dd}>{p.email}</div></div>
        <div><div className={dl}>Nom affiché</div><div className={dd}>{p.display_name ?? "—"}</div></div>
        <div><div className={dl}>Inscrit le</div><div className={dd}>{dateTime(p.created_at)}</div></div>
        <div><div className={dl}>KYC vérifié le</div><div className={dd}>{dateTime(p.kyc_verified_at)}</div></div>
        <div><div className={dl}>Stripe customer</div><div className="mt-1 font-mono text-xs">{p.stripe_customer_id ?? "—"}</div></div>
        <div><div className={dl}>Newsletter</div><div className={dd}>{p.newsletter_subscribed ? "Oui" : "Non"}</div></div>
      </Card>

      <h3 className="mb-2 mt-6 font-display text-xl">Commandes</h3>
      {(txs ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune commande.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border"><tr><th className={th}>Date</th><th className={th}>Drop</th><th className={th}>Payé</th><th className={th}>Paiement</th><th className={th}>Livraison</th></tr></thead>
            <tbody>
              {((txs ?? []) as Record<string, any>[]).map((t) => {
                const del = t.deliveries?.[0]?.status as DeliveryStatus | undefined;
                return (
                  <tr key={t.id} className="border-b border-border/60 last:border-0">
                    <td className={`${td} text-muted-foreground`}>{dateTime(t.created_at)}</td>
                    <td className={td}><Link href={`/admin/commandes/${t.id}`} className="font-medium hover:text-[var(--champagne)]">№ {t.drops?.drop_number} {t.drops?.title}</Link></td>
                    <td className={td}>{eur(t.amount_paid_cents)}</td>
                    <td className={td}><Badge tone={TX_TONE[t.status as TxStatus]}>{TX_FR[t.status as TxStatus]}</Badge></td>
                    <td className={td}>{del ? <Badge tone={DELIVERY_TONE[del]}>{DELIVERY_FR[del]}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="mb-2 mt-6 font-display text-xl">Enchères</h3>
      {(bids ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune enchère.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border"><tr><th className={th}>Date</th><th className={th}>Drop</th><th className={th}>Montant</th><th className={th}>Statut</th></tr></thead>
            <tbody>
              {((bids ?? []) as Record<string, any>[]).map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0">
                  <td className={`${td} text-muted-foreground`}>{dateTime(b.submitted_at)}</td>
                  <td className={td}>№ {b.drops?.drop_number} {b.drops?.title} {b.drops?.status && <Badge tone={DROP_TONE[b.drops.status as DropStatus]} className="ml-1.5">{DROP_FR[b.drops.status as DropStatus]}</Badge>}</td>
                  <td className={td}>{eur(b.amount_cents)}</td>
                  <td className={`${td} text-muted-foreground`}>{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Actions de support (override KYC, etc.) : non exposées ici par prudence (compliance) — à cadrer sur la page Support.
      </p>
    </>
  );
}
