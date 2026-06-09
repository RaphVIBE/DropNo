import Link from "next/link";

import { Card } from "@/lib/admin/ui";
import { MaisonForm } from "../MaisonForm";
import { createMaison } from "../actions";

export const dynamic = "force-dynamic";

export default function NewMaisonPage() {
  return (
    <>
      <Link href="/admin/maisons" className="text-sm text-muted-foreground hover:text-foreground">← Maisons</Link>
      <h1 className="mt-2 font-display text-3xl">Nouvelle maison</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Renseigne la fiche. Tu inviteras le ou les responsables une fois la maison créée.</p>
      <Card className="max-w-xl">
        <MaisonForm action={createMaison} />
      </Card>
    </>
  );
}
