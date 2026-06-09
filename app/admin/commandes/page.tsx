import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Badge, PageHeader } from "@/lib/admin/ui";
import { eur, dateTime } from "@/lib/admin/format";
import { TX_FR, TX_TONE, DELIVERY_FR, DELIVERY_TONE, type TxStatus, type DeliveryStatus } from "@/lib/admin/orders";

export const dynamic = "force-dynamic";

type Row = {
  id: string; created_at: string; amount_paid_cents: number; status: TxStatus;
  drops: { drop_number: number; title: string; brands: { name: string } | null } | null;
  profiles: { email: string; display_name: string | null } | null;
  deliveries: { status: DeliveryStatus }[] | null;
};

const th = "px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-4 py-3 align-middle";

export default async function CommandesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("transactions")
    .select("id, created_at, amount_paid_cents, status, drops(drop_number, title, brands(name)), profiles(email, display_name), deliveries(status)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader title="Commandes & livraisons" subtitle="Chaque commande naît d'une enchère gagnante capturée au reveal." />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucune commande pour l&apos;instant.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>Date</th><th className={th}>Drop</th><th className={th}>Client</th>
                <th className={th}>Payé</th><th className={th}>Paiement</th><th className={th}>Livraison</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const del = t.deliveries?.[0]?.status;
                return (
                  <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                    <td className={`${td} text-muted-foreground`}>{dateTime(t.created_at)}</td>
                    <td className={`${td} font-medium`}>
                      <Link href={`/admin/commandes/${t.id}`} className="hover:text-[var(--champagne)]">№ {t.drops?.drop_number} {t.drops?.title}</Link>
                      <div className="text-xs text-muted-foreground">{t.drops?.brands?.name}</div>
                    </td>
                    <td className={`${td} text-muted-foreground`}>{t.profiles?.display_name ?? t.profiles?.email ?? "—"}</td>
                    <td className={td}>{eur(t.amount_paid_cents)}</td>
                    <td className={td}><Badge tone={TX_TONE[t.status]}>{TX_FR[t.status]}</Badge></td>
                    <td className={td}>{del ? <Badge tone={DELIVERY_TONE[del]}>{DELIVERY_FR[del]}</Badge> : <span className="text-xs text-muted-foreground">— à créer</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
