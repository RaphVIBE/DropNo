import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, PageHeader } from "@/lib/admin/ui";
import { STATUS_FR, STATUS_TONE, type BrandStatus } from "@/lib/admin/maisons";

export const dynamic = "force-dynamic";

type Row = {
  id: string; name: string; slug: string; status: BrandStatus; country_code: string | null;
  drops: { count: number }[]; brand_admins: { count: number }[];
};

const th = "px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-4 py-3 align-middle";

export default async function MaisonsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("brands")
    .select("id, name, slug, status, country_code, drops(count), brand_admins(count)")
    .order("name");
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader
        title="Maisons & invitations"
        subtitle="Tu remplis la fiche maison ; les responsables invités peuvent l'adapter, dans les limites imposées."
        action={<Button asChild className="hover:bg-[oklch(0.78_0.075_82)]"><Link href="/admin/maisons/new">+ Nouvelle maison</Link></Button>}
      />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Aucune maison. Crée la première.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr><th className={th}>Maison</th><th className={th}>Statut</th><th className={th}>Pays</th><th className={th}>Drops</th><th className={th}>Responsables</th></tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                  <td className={`${td} font-medium`}>
                    <Link href={`/admin/maisons/${b.id}`} className="hover:text-[var(--champagne)]">{b.name}</Link>
                    <div className="text-xs text-muted-foreground">{b.slug}</div>
                  </td>
                  <td className={td}><Badge tone={STATUS_TONE[b.status]}>{STATUS_FR[b.status]}</Badge></td>
                  <td className={`${td} text-muted-foreground`}>{b.country_code ?? "—"}</td>
                  <td className={td}>{b.drops?.[0]?.count ?? 0}</td>
                  <td className={td}>{b.brand_admins?.[0]?.count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
