import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/lib/admin/ui";
import { STATUS_FR, STATUS_TONE, canPublish, canCancel, canDelete, type DropStatus } from "@/lib/admin/drops";
import { eur, dateTime } from "@/lib/admin/format";
import { DropForm } from "../DropForm";
import { publishDrop, cancelDrop, deleteDrop, saveDrop } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditDropPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: drop }, { data: brands }] = await Promise.all([
    supabase.from("drops").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("brands").select("id, name").order("name"),
  ]);
  if (!drop) notFound();

  const status = drop.status as DropStatus;

  return (
    <>
      <Link href="/admin/produits" className="text-sm text-muted-foreground hover:text-foreground">← Produits / Drops</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">№ {drop.drop_number} · {drop.title}</h1>
        <Badge tone={STATUS_TONE[status]}>{STATUS_FR[status]}</Badge>
      </div>

      <Card className="mb-4 mt-4 flex flex-wrap items-center gap-3">
        {canPublish(status) && (
          <form action={publishDrop}>
            <input type="hidden" name="id" value={drop.id} />
            <Button type="submit" className="hover:bg-[oklch(0.78_0.075_82)]">Publier → programmé</Button>
          </form>
        )}
        {status === "revealed" && (
          <span className="text-sm text-muted-foreground">Clôturé à {eur(drop.clearing_price_cents)} · révélé le {dateTime(drop.revealed_at)}.</span>
        )}
        {(status === "open" || status === "closed") && (
          <span className="text-sm text-muted-foreground">Enchère en cours · reveal {dateTime(drop.reveal_at)} (clôture automatique).</span>
        )}
        {status === "scheduled" && (
          <span className="text-sm text-muted-foreground">Programmé · ouverture automatique le {dateTime(drop.bid_window_opens_at)}.</span>
        )}
        <span className="flex-1" />
        {canCancel(status) && (
          <form action={cancelDrop}>
            <input type="hidden" name="id" value={drop.id} />
            <Button type="submit" variant="outline">Annuler le drop</Button>
          </form>
        )}
        {canDelete(status) && (
          <form action={deleteDrop}>
            <input type="hidden" name="id" value={drop.id} />
            <Button type="submit" variant="outline" className="border-red-500/40 text-red-300 hover:bg-red-500/10">Supprimer</Button>
          </form>
        )}
      </Card>

      <Card className="max-w-2xl">
        <DropForm action={saveDrop} brands={brands ?? []} drop={drop} status={status} />
      </Card>
    </>
  );
}
