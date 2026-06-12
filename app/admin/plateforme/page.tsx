import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/admin/auth";
import { Button } from "@/components/ui/button";
import { Badge, Card, PageHeader, Pagination } from "@/lib/admin/ui";
import { eur, dateTime, dateShort } from "@/lib/admin/format";
import {
  ADMIN_ROLE_FR, ADMIN_ROLE_TONE, AUDIT_ACTIONS, AUDIT_FR, AUDIT_TONE,
  isAuditAction, type AdminRole, type AuditAction, type AuditRow,
} from "@/lib/admin/plateforme";
import { retirerAdmin } from "./actions";
import { AjouterAdminForm } from "./AjouterAdminForm";

export const dynamic = "force-dynamic";

const th = "px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-4 py-3 align-middle";
const field =
  "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const PAGE_SIZE = 50;

export default async function PlateformePage({
  searchParams,
}: {
  searchParams: { drop?: string; action?: string; page?: string };
}) {
  const supabase = createClient();
  const role = await getRole();
  const myId = role.kind === "platform_admin" ? role.userId : null;

  const dropFilter = searchParams.drop || null;
  const actionFilter = searchParams.action && isAuditAction(searchParams.action) ? searchParams.action : null;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [adminsRes, dropsRes, auditRes] = await Promise.all([
    supabase
      .from("platform_admins")
      .select("user_id, role, created_at, profiles(email, display_name)")
      .order("created_at", { ascending: true }),
    supabase
      .from("drops")
      .select("id, drop_number, title")
      .order("drop_number", { ascending: false })
      .limit(100),
    supabase.rpc("get_bid_audit", {
      p_drop: dropFilter ?? undefined,
      p_action: actionFilter ?? undefined,
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    }),
  ]);

  const admins = adminsRes.data ?? [];
  const drops = dropsRes.data ?? [];
  const audit = (auditRes.data ?? []) as unknown as AuditRow[];

  return (
    <>
      <PageHeader
        title="Plateforme"
        subtitle="Équipe d'opérateurs et journal d'audit des enchères (hash chain append-only)."
      />

      {/* Équipe */}
      <Card>
        <h3 className="font-display text-xl">Équipe plateforme</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Owner : gère l&apos;équipe. Staff : tout le reste du back-office. Garde DB : impossible de retirer le dernier owner.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>Email</th>
                <th className={th}>Nom</th>
                <th className={th}>Rôle</th>
                <th className={th}>Depuis</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.user_id} className="border-b border-border/60 last:border-0">
                  <td className={`${td} font-medium`}>{a.profiles?.email ?? "—"}</td>
                  <td className={`${td} text-muted-foreground`}>{a.profiles?.display_name ?? "—"}</td>
                  <td className={td}>
                    <Badge tone={ADMIN_ROLE_TONE[a.role as AdminRole]}>{ADMIN_ROLE_FR[a.role as AdminRole]}</Badge>
                  </td>
                  <td className={`${td} text-muted-foreground`}>{dateShort(a.created_at)}</td>
                  <td className={td}>
                    {a.user_id === myId ? (
                      <span className="text-xs text-muted-foreground">vous</span>
                    ) : (
                      <form action={retirerAdmin}>
                        <input type="hidden" name="user_id" value={a.user_id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-xs hover:text-red-300">
                          Retirer
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <AjouterAdminForm />
        </div>
      </Card>

      {/* Journal d'audit */}
      <h2 className="mt-7 font-display text-xl">Journal des enchères</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Append-only, intégrité par hash chain. Les montants restent masqués tant que le drop n&apos;est pas révélé ou annulé — hygiène sealed-bid, opérateur compris.
      </p>

      <form action="/admin/plateforme" className="mt-3 flex flex-wrap items-center gap-2">
        <select name="drop" defaultValue={dropFilter ?? ""} className={field}>
          <option value="">Tous les drops</option>
          {drops.map((d) => (
            <option key={d.id} value={d.id}>
              № {String(d.drop_number).padStart(3, "0")} · {d.title}
            </option>
          ))}
        </select>
        <select name="action" defaultValue={actionFilter ?? ""} className={field}>
          <option value="">Toutes les actions</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>{AUDIT_FR[a]}</option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">Filtrer</Button>
        {(dropFilter || actionFilter) && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/plateforme">Effacer</Link>
          </Button>
        )}
      </form>

      <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
        {audit.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Aucune entrée.</div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>Quand</th>
                <th className={th}>Action</th>
                <th className={th}>Drop</th>
                <th className={th}>Client</th>
                <th className={th}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
                  <td className={`${td} whitespace-nowrap text-muted-foreground`}>{dateTime(r.occurred_at)}</td>
                  <td className={td}>
                    <Badge tone={AUDIT_TONE[r.action as AuditAction] ?? "zinc"}>
                      {AUDIT_FR[r.action as AuditAction] ?? r.action}
                    </Badge>
                  </td>
                  <td className={td}>
                    <Link href={`/admin/cloture/${r.drop_id}`} className="hover:text-[var(--champagne)]">
                      № {String(r.drop_number).padStart(3, "0")} {r.drop_title}
                    </Link>
                  </td>
                  <td className={`${td} text-muted-foreground`}>{r.user_email ?? "—"}</td>
                  <td className={td}>
                    {r.amount_cents != null ? (
                      eur(r.amount_cents)
                    ) : (
                      <span className="text-xs text-muted-foreground" title="Masqué jusqu'au reveal">●●●</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        basePath="/admin/plateforme"
        page={page}
        hasNext={audit.length === PAGE_SIZE}
        params={{ drop: dropFilter ?? undefined, action: actionFilter ?? undefined }}
      />
    </>
  );
}
