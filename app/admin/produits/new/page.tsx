import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Card } from "@/lib/admin/ui";
import { nextRevealSlots } from "@/lib/admin/drops";
import { DropForm } from "../DropForm";
import { createDraft } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewDropPage() {
  const supabase = createClient();
  const { data: brands } = await supabase.from("brands").select("id, name").order("name");
  const revealSlots = nextRevealSlots(new Date().toISOString(), 16);

  return (
    <>
      <Link href="/admin/produits" className="text-sm text-muted-foreground hover:text-foreground">← Produits / Drops</Link>
      <h1 className="mt-2 font-display text-3xl">Nouveau drop</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Créé en brouillon. Tu le publieras (→ programmé) une fois prêt ; le cron l&apos;ouvrira à l&apos;heure d&apos;ouverture.
      </p>
      <Card className="max-w-2xl">
        <DropForm action={createDraft} brands={brands ?? []} revealSlots={revealSlots} />
      </Card>
    </>
  );
}
