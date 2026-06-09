import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/lib/admin/ui";
import { dateTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import {
  STATUS_FR, STATUS_TONE, CATEGORY_FR, PRIORITY_FR, PRIORITY_TONE, STATUSES, PRIORITIES,
  type TicketStatus, type Priority, type Category,
} from "@/lib/admin/support";
import { postReply, setStatus, setPriority, assignToMe } from "../actions";

export const dynamic = "force-dynamic";

const dl = "text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground";
const sel = "rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function TicketDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: t } = await supabase
    .from("support_tickets")
    .select("*, profiles!support_tickets_user_id_fkey(email, display_name), transactions(drops(drop_number,title)), assignee:profiles!support_tickets_assigned_to_fkey(email)")
    .eq("id", params.id)
    .maybeSingle();
  if (!t) notFound();

  const { data: messages } = await supabase.from("support_messages").select("*").eq("ticket_id", params.id).order("created_at", { ascending: true });

  const status = t.status as TicketStatus;
  const priority = t.priority as Priority;

  return (
    <>
      <Link href="/admin/support" className="text-sm text-muted-foreground hover:text-foreground">← Support</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{t.subject}</h1>
        <Badge tone={STATUS_TONE[status]}>{STATUS_FR[status]}</Badge>
      </div>

      <Card className="mt-4 flex flex-wrap items-center gap-6">
        <div><div className={dl}>Client</div><div className="mt-1 text-sm font-medium">{t.user_id ? <Link href={`/admin/clients/${t.user_id}`} className="hover:text-[var(--champagne)]">{t.profiles?.display_name ?? t.profiles?.email ?? "—"}</Link> : "—"}</div></div>
        <div><div className={dl}>Catégorie</div><div className="mt-1 text-sm font-medium">{CATEGORY_FR[t.category as Category]}</div></div>
        <div><div className={dl}>Commande liée</div><div className="mt-1 text-sm font-medium">{t.related_transaction_id ? <Link href={`/admin/commandes/${t.related_transaction_id}`} className="hover:text-[var(--champagne)]">№ {t.transactions?.drops?.drop_number} {t.transactions?.drops?.title}</Link> : "—"}</div></div>
        <div><div className={dl}>Assigné à</div><div className="mt-1 text-sm font-medium">{t.assignee?.email ?? "—"}</div></div>
        <span className="flex-1" />
        <form action={assignToMe}><input type="hidden" name="ticket_id" value={t.id} /><Button type="submit" variant="outline" size="sm">M&apos;assigner</Button></form>
      </Card>

      <div className="my-4 flex flex-wrap gap-3">
        <form action={setStatus} className="flex gap-2">
          <input type="hidden" name="ticket_id" value={t.id} />
          <select name="status" defaultValue={status} className={sel}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_FR[s]}</option>)}</select>
          <Button type="submit" variant="outline" size="sm">Statut</Button>
        </form>
        <form action={setPriority} className="flex items-center gap-2">
          <input type="hidden" name="ticket_id" value={t.id} />
          <Badge tone={PRIORITY_TONE[priority]}>{PRIORITY_FR[priority]}</Badge>
          <select name="priority" defaultValue={priority} className={sel}>{PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_FR[p]}</option>)}</select>
          <Button type="submit" variant="outline" size="sm">Priorité</Button>
        </form>
      </div>

      <div className="mb-4 flex flex-col gap-2.5">
        {((messages ?? []) as Record<string, any>[]).map((m) => {
          const staff = m.author_kind === "staff";
          const internal = m.is_internal;
          return (
            <div key={m.id} className={cn(
              "max-w-[78%] rounded-xl border px-3.5 py-2.5",
              staff ? "self-end" : "self-start",
              internal ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                : staff ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground"
            )}>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-75">
                {internal ? "Note interne" : staff ? "Staff" : "Client"} · {dateTime(m.created_at)}
              </div>
              <div className="whitespace-pre-wrap text-sm">{m.body}</div>
            </div>
          );
        })}
      </div>

      <Card>
        <form action={postReply}>
          <input type="hidden" name="ticket_id" value={t.id} />
          <textarea name="body" rows={3} required maxLength={5000} placeholder="Répondre au client…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <div className="mt-3 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="is_internal" /> Note interne (non visible du client)
            </label>
            <Button type="submit" className="hover:bg-[oklch(0.78_0.075_82)]">Envoyer</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
