import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Badge, Kpi, PageHeader } from "@/lib/admin/ui";
import { eur, dateTime, dateShort } from "@/lib/admin/format";
import {
  computePayout, payoutDelta, payoutStatus, PAYOUT_FR, PAYOUT_TONE,
  type TxLite, type SerialOfferLite,
} from "@/lib/admin/finance";
import { annulerPaiement } from "./actions";
import { PayerForm } from "./PayerForm";

export const dynamic = "force-dynamic";

const th = "px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-4 py-3 align-middle";

type DropRow = {
  id: string;
  drop_number: number;
  title: string;
  reveal_at: string;
  clearing_price_cents: number | null;
  brands: { name: string } | null;
};

type PayoutRow = {
  id: string;
  drop_id: string;
  units: number;
  net_cents: number;
  payment_reference: string | null;
  paid_at: string;
};

const ORDER = { blocked: 0, payable: 1, retractation: 2, paid: 3, nothing: 4 } as const;

export default async function FinancePage() {
  const supabase = createClient();
  const nowMs = Date.now();

  const { data: dropsData } = await supabase
    .from("drops")
    .select("id, drop_number, title, reveal_at, clearing_price_cents, brands(name)")
    .eq("status", "revealed")
    .order("reveal_at", { ascending: false });
  const drops = (dropsData ?? []) as unknown as DropRow[];
  const ids = drops.map((d) => d.id);

  const [txRes, payoutRes, offerRes] = await Promise.all([
    ids.length
      ? supabase
          .from("transactions")
          .select("drop_id, status, amount_paid_cents, platform_fee_cents, brand_payout_cents, withdrawal_window_ends_at")
          .in("drop_id", ids)
      : Promise.resolve({ data: [] as (TxLite & { drop_id: string })[] }),
    ids.length
      ? supabase
          .from("drop_payouts")
          .select("id, drop_id, units, net_cents, payment_reference, paid_at")
          .in("drop_id", ids)
      : Promise.resolve({ data: [] as PayoutRow[] }),
    // Privilège № 001 : suppléments acceptés, intégrés au dû maison.
    ids.length
      ? supabase
          .from("serial_offers")
          .select("drop_id, status, supplement_cents")
          .in("drop_id", ids)
      : Promise.resolve({ data: [] as (SerialOfferLite & { drop_id: string })[] }),
  ]);

  const txByDrop = new Map<string, TxLite[]>();
  for (const t of (txRes.data ?? []) as (TxLite & { drop_id: string })[]) {
    const list = txByDrop.get(t.drop_id) ?? [];
    list.push(t);
    txByDrop.set(t.drop_id, list);
  }
  const payoutByDrop = new Map(((payoutRes.data ?? []) as PayoutRow[]).map((p) => [p.drop_id, p]));

  const offersByDrop = new Map<string, SerialOfferLite[]>();
  for (const o of (offerRes.data ?? []) as (SerialOfferLite & { drop_id: string })[]) {
    const list = offersByDrop.get(o.drop_id) ?? [];
    list.push(o);
    offersByDrop.set(o.drop_id, list);
  }

  const rows = drops
    .map((d) => {
      const c = computePayout(txByDrop.get(d.id) ?? [], nowMs, offersByDrop.get(d.id) ?? []);
      const payout = payoutByDrop.get(d.id);
      const status = payoutStatus(c, !!payout);
      const delta = payout ? payoutDelta(payout.net_cents, c) : 0;
      return { d, c, payout, status, delta };
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.d.reveal_at < b.d.reveal_at ? 1 : -1));

  const duNow = rows.filter((r) => r.status === "payable").reduce((s, r) => s + r.c.netCents, 0);
  const enRetract = rows.filter((r) => r.status === "retractation").reduce((s, r) => s + r.c.netCents, 0);
  const payeCumule = rows.reduce((s, r) => s + (r.payout?.net_cents ?? 0), 0);
  const feeCumule = rows.reduce((s, r) => s + r.c.feeCents, 0);

  return (
    <>
      <PageHeader
        title="Finance"
        subtitle="Payouts maisons par drop révélé. Le dû se calcule depuis les transactions capturées, versement après la fenêtre de rétractation (14 j)."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="À payer maintenant" value={eur(duNow)} />
        <Kpi label="En rétractation" value={eur(enRetract)} />
        <Kpi label="Payé cumulé" value={eur(payeCumule)} />
        <Kpi label="Commission cumulée" value={eur(feeCumule)} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Aucun drop révélé pour l&apos;instant.</div>
        ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Drop</th>
                <th className={th}>Reveal</th>
                <th className={th}>Vendus</th>
                <th className={th}>CA capturé</th>
                <th className={th}>Commission</th>
                <th className={th}>Net maison</th>
                <th className={th}>Rétractation</th>
                <th className={th}>Statut</th>
                <th className={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ d, c, payout, status, delta }) => (
                <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                  <td className={`${td} text-muted-foreground`}>{d.drop_number}</td>
                  <td className={`${td} font-medium`}>
                    <Link href={`/admin/cloture/${d.id}`} className="hover:text-[var(--champagne)]">{d.title}</Link>
                    <span className="ml-2 text-xs text-muted-foreground">{d.brands?.name}</span>
                  </td>
                  <td className={`${td} text-muted-foreground`}>{dateShort(d.reveal_at)}</td>
                  <td className={td}>
                    {c.units}
                    {c.refunds > 0 && <span className="ml-1 text-xs text-amber-300">(−{c.refunds} remb.)</span>}
                  </td>
                  <td className={td}>{eur(c.grossCents)}</td>
                  <td className={`${td} text-muted-foreground`}>{eur(c.feeCents)}</td>
                  <td className={`${td} font-semibold`}>{eur(c.netCents)}</td>
                  <td className={`${td} text-xs text-muted-foreground`}>
                    {c.retractationEndsAt ? `jusqu'au ${dateShort(c.retractationEndsAt)}` : "—"}
                  </td>
                  <td className={td}>
                    <Badge tone={PAYOUT_TONE[status]}>{PAYOUT_FR[status]}</Badge>
                    {payout && delta !== 0 && (
                      <div className="mt-1 text-xs text-red-300">
                        Écart {eur(delta)} vs dû actuel (remboursement post-virement ?)
                      </div>
                    )}
                  </td>
                  <td className={td}>
                    {status === "payable" ? (
                      <PayerForm dropId={d.id} />
                    ) : status === "paid" && payout ? (
                      <div className="text-xs text-muted-foreground">
                        {dateTime(payout.paid_at)}
                        {payout.payment_reference && <div className="font-mono">{payout.payment_reference}</div>}
                        <form action={annulerPaiement} className="mt-1">
                          <input type="hidden" name="id" value={payout.id} />
                          <button type="submit" className="text-[11px] underline-offset-2 hover:text-red-300 hover:underline">
                            Annuler (erreur de saisie)
                          </button>
                        </form>
                      </div>
                    ) : status === "blocked" ? (
                      <Link href={`/admin/cloture/${d.id}`} className="text-xs underline-offset-2 hover:text-[var(--champagne)] hover:underline">
                        Régler dans Clôture →
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Le virement lui-même reste manuel (banque). Cet écran enregistre le fait générateur et fige les montants —
        les remboursements Stripe depuis le back-office viendront dans une itération dédiée.
      </p>
    </>
  );
}
