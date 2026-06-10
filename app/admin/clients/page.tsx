import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Badge, Kpi, PageHeader, FilterTabs, SearchBox, Pagination } from "@/lib/admin/ui";
import { eur, dateTime } from "@/lib/admin/format";
import { KYC_FR, KYC_TONE, type KycStatus } from "@/lib/admin/clients";

export const dynamic = "force-dynamic";

type Row = {
  id: string; email: string; display_name: string | null; kyc_status: KycStatus;
  newsletter_subscribed: boolean; created_at: string;
  bids_count: number; orders_count: number; total_spent_cents: number;
};

const th = "px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-4 py-3 align-middle";

const PAGE = 25;
const KYC_STATUSES: KycStatus[] = ["pending", "verifying", "verified", "rejected"];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  const active = KYC_STATUSES.includes(searchParams.status as KycStatus)
    ? (searchParams.status as KycStatus)
    : "all";
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE;
  const statusParam = active !== "all" ? active : undefined;

  const supabase = createClient();
  const { data } = await supabase.rpc("get_client_overview");
  const all = (data ?? []) as Row[];

  // KPIs sur l'ensemble des comptes (avant filtrage).
  const verified = all.filter((r) => r.kyc_status === "verified").length;
  const buyers = all.filter((r) => r.orders_count > 0).length;

  // Filtrage côté page (la RPC renvoie tout).
  const filtered = all.filter((r) => {
    if (statusParam && r.kyc_status !== statusParam) return false;
    if (q && !`${r.email ?? ""} ${r.display_name ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const hasNext = from + PAGE < filtered.length;
  const rows = filtered.slice(from, from + PAGE);

  return (
    <>
      <PageHeader title="Clients & comptes" subtitle="Tous les comptes, leur statut KYC et leur activité. Le KYC est piloté par Stripe Identity." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Comptes" value={all.length} />
        <Kpi label="KYC vérifiés" value={verified} />
        <Kpi label="Acheteurs" value={buyers} />
        <Kpi label="Newsletter" value={all.filter((r) => r.newsletter_subscribed).length} />
      </div>

      <FilterTabs
        basePath="/admin/clients"
        active={active}
        params={{ q: searchParams.q }}
        tabs={[{ key: "all", label: "Tous" }, ...KYC_STATUSES.map((s) => ({ key: s, label: KYC_FR[s] }))]}
      />
      <SearchBox basePath="/admin/clients" defaultValue={searchParams.q} placeholder="Email ou nom…" hidden={{ status: statusParam }} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {q || statusParam ? "Aucun compte ne correspond à ces critères." : "Aucun compte pour l'instant."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>Client</th><th className={th}>KYC</th><th className={th}>Enchères</th>
                <th className={th}>Commandes</th><th className={th}>Total dépensé</th><th className={th}>Inscrit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                  <td className={`${td} font-medium`}>
                    <Link href={`/admin/clients/${c.id}`} className="hover:text-[var(--champagne)]">{c.display_name ?? c.email}</Link>
                    {c.display_name && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  </td>
                  <td className={td}><Badge tone={KYC_TONE[c.kyc_status]}>{KYC_FR[c.kyc_status]}</Badge></td>
                  <td className={td}>{c.bids_count}</td>
                  <td className={td}>{c.orders_count}</td>
                  <td className={td}>{eur(c.total_spent_cents)}</td>
                  <td className={`${td} text-muted-foreground`}>{dateTime(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination basePath="/admin/clients" page={page} hasNext={hasNext} params={{ status: statusParam, q: searchParams.q }} />
    </>
  );
}
