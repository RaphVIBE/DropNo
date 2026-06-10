import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, PageHeader, FilterTabs, SearchBox, Pagination } from "@/lib/admin/ui";
import { STATUS_FR, STATUS_TONE, type DropStatus } from "@/lib/admin/drops";
import { eur, dateTime } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string; drop_number: number; title: string; status: DropStatus;
  exemplaires: number; floor_price_cents: number;
  bid_window_opens_at: string | null; reveal_at: string | null;
  brands: { name: string } | null;
};

const th = "px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-4 py-3 align-middle";

const PAGE = 20;
const DROP_STATUSES: DropStatus[] = ["draft", "scheduled", "open", "closed", "revealed", "cancelled"];

export default async function ProduitsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  const active = DROP_STATUSES.includes(searchParams.status as DropStatus)
    ? (searchParams.status as DropStatus)
    : "all";
  const q = (searchParams.q ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE;
  const statusParam = active !== "all" ? active : undefined;

  const supabase = createClient();
  let query = supabase
    .from("drops")
    .select("id, drop_number, title, status, exemplaires, floor_price_cents, bid_window_opens_at, reveal_at, brands(name)")
    .order("drop_number", { ascending: false })
    .range(from, from + PAGE);
  if (statusParam) query = query.eq("status", statusParam);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data } = await query;
  const all = (data ?? []) as unknown as Row[];
  const hasNext = all.length > PAGE;
  const rows = all.slice(0, PAGE);

  return (
    <>
      <PageHeader
        title="Produits / Drops"
        subtitle="Création, contenu et planning des fenêtres d'enchères."
        action={
          <Button asChild className="hover:bg-[oklch(0.78_0.075_82)]">
            <Link href="/admin/produits/new">+ Nouveau drop</Link>
          </Button>
        }
      />

      <FilterTabs
        basePath="/admin/produits"
        active={active}
        params={{ q }}
        tabs={[{ key: "all", label: "Tous" }, ...DROP_STATUSES.map((s) => ({ key: s, label: STATUS_FR[s] }))]}
      />
      <SearchBox basePath="/admin/produits" defaultValue={q} placeholder="Titre du drop…" hidden={{ status: statusParam }} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {q || statusParam ? "Aucun drop ne correspond à ces critères." : "Aucun drop pour l'instant. Crée le premier."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Drop</th>
                <th className={th}>Maison</th>
                <th className={th}>Statut</th>
                <th className={th}>Plancher</th>
                <th className={th}>Ex.</th>
                <th className={th}>Ouverture</th>
                <th className={th}>Reveal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                  <td className={`${td} text-muted-foreground`}>{d.drop_number}</td>
                  <td className={`${td} font-medium`}>
                    <Link href={`/admin/produits/${d.id}`} className="hover:text-[var(--champagne)]">{d.title}</Link>
                  </td>
                  <td className={`${td} text-muted-foreground`}>{d.brands?.name ?? "—"}</td>
                  <td className={td}><Badge tone={STATUS_TONE[d.status]}>{STATUS_FR[d.status]}</Badge></td>
                  <td className={td}>{eur(d.floor_price_cents)}</td>
                  <td className={td}>{d.exemplaires}</td>
                  <td className={`${td} text-muted-foreground`}>{dateTime(d.bid_window_opens_at)}</td>
                  <td className={`${td} text-muted-foreground`}>{dateTime(d.reveal_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination basePath="/admin/produits" page={page} hasNext={hasNext} params={{ status: statusParam, q }} />
    </>
  );
}
