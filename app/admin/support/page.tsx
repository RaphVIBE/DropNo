import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, PageHeader } from "@/lib/admin/ui";
import { dateTime } from "@/lib/admin/format";
import { STATUS_FR, STATUS_TONE, CATEGORY_FR, PRIORITY_FR, PRIORITY_TONE, STATUSES, type TicketStatus, type Priority, type Category } from "@/lib/admin/support";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Row = {
  id: string; subject: string; category: Category; status: TicketStatus; priority: Priority;
  last_activity_at: string; profiles: { email: string; display_name: string | null } | null;
  support_messages: { count: number }[];
};

const th = "px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-4 py-3 align-middle";

export default async function SupportPage({ searchParams }: { searchParams: { status?: string } }) {
  const active = searchParams.status && STATUSES.includes(searchParams.status as TicketStatus) ? (searchParams.status as TicketStatus) : "all";

  const supabase = createClient();
  let q = supabase
    .from("support_tickets")
    .select("id, subject, category, status, priority, last_activity_at, profiles(email, display_name), support_messages(count)")
    .order("last_activity_at", { ascending: false });
  if (active !== "all") q = q.eq("status", active);
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];

  const tabs: { key: string; label: string }[] = [{ key: "all", label: "Tous" }, ...STATUSES.map((s) => ({ key: s, label: STATUS_FR[s] }))];

  return (
    <>
      <PageHeader
        title="Support"
        subtitle="Tickets clients : commandes, livraisons, KYC, paiements."
        action={<Button asChild className="hover:bg-[oklch(0.78_0.075_82)]"><Link href="/admin/support/new">+ Nouveau ticket</Link></Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.key} href={t.key === "all" ? "/admin/support" : `/admin/support?status=${t.key}`}
            className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              active === t.key ? "border-transparent bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
            {t.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Aucun ticket{active !== "all" ? " dans ce statut" : ""}.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr><th className={th}>Sujet</th><th className={th}>Client</th><th className={th}>Catégorie</th><th className={th}>Priorité</th><th className={th}>Statut</th><th className={th}>Activité</th></tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                  <td className={`${td} font-medium`}>
                    <Link href={`/admin/support/${t.id}`} className="hover:text-[var(--champagne)]">{t.subject}</Link>
                    <span className="ml-1.5 text-xs text-muted-foreground">· {t.support_messages?.[0]?.count ?? 0} msg</span>
                  </td>
                  <td className={`${td} text-muted-foreground`}>{t.profiles?.display_name ?? t.profiles?.email ?? "—"}</td>
                  <td className={`${td} text-muted-foreground`}>{CATEGORY_FR[t.category]}</td>
                  <td className={td}><Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_FR[t.priority]}</Badge></td>
                  <td className={td}><Badge tone={STATUS_TONE[t.status]}>{STATUS_FR[t.status]}</Badge></td>
                  <td className={`${td} text-muted-foreground`}>{dateTime(t.last_activity_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
