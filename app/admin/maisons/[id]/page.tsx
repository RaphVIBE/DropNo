import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/lib/admin/ui";
import { STATUS_FR, STATUS_TONE, type BrandStatus } from "@/lib/admin/maisons";
import { dateTime } from "@/lib/admin/format";
import { MaisonForm, type Brand } from "../MaisonForm";
import { saveMaison, inviteManager, revokeManager } from "../actions";

export const dynamic = "force-dynamic";

const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function MaisonDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: brand } = await supabase.from("brands").select("*").eq("id", params.id).maybeSingle();
  if (!brand) notFound();

  const { data: managers } = await supabase
    .from("brand_admins")
    .select("user_id, role, created_at, profiles(email, display_name)")
    .eq("brand_id", params.id)
    .order("created_at");

  const status = brand.status as BrandStatus;

  return (
    <>
      <Link href="/admin/maisons" className="text-sm text-muted-foreground hover:text-foreground">← Maisons</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{brand.name}</h1>
        <Badge tone={STATUS_TONE[status]}>{STATUS_FR[status]}</Badge>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <h3 className="mb-3 font-display text-xl">Fiche maison</h3>
          <MaisonForm action={saveMaison} brand={brand as unknown as Brand} />
        </Card>

        <Card>
          <h3 className="font-display text-xl">Responsables</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Accès sur invitation. <b className="text-foreground/80">admin</b> édite la fiche et gère les drops ; <b className="text-foreground/80">viewer</b> est en lecture seule.
          </p>

          {(managers ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aucun responsable invité.</p>
          ) : (
            <div className="mt-3">
              {((managers ?? []) as unknown as {
                user_id: string; role: string; created_at: string;
                profiles: { email: string | null; display_name: string | null } | null;
              }[]).map((m) => (
                <div key={m.user_id} className="flex items-center justify-between gap-2 border-b border-border/60 py-2.5 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{m.profiles?.display_name ?? m.profiles?.email ?? m.user_id}</div>
                    <div className="text-xs text-muted-foreground">{m.profiles?.email} · {m.role} · invité {dateTime(m.created_at)}</div>
                  </div>
                  <form action={revokeManager}>
                    <input type="hidden" name="brand_id" value={brand.id} />
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <Button type="submit" variant="outline" size="sm" className="border-red-500/40 text-red-300 hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-200">Révoquer</Button>
                  </form>
                </div>
              ))}
            </div>
          )}

          <form action={inviteManager} className="mt-4 border-t border-border pt-4">
            <input type="hidden" name="brand_id" value={brand.id} />
            <div className="mb-1.5 text-xs font-medium text-foreground/80">Inviter un responsable</div>
            <input name="email" type="email" required placeholder="responsable@maison.com" className={`${field} mb-2`} />
            <div className="flex gap-2">
              <select name="role" defaultValue="admin" className={`${field} flex-1`}>
                <option value="admin">Admin (édition)</option>
                <option value="viewer">Viewer (lecture)</option>
              </select>
              <Button type="submit" className="hover:bg-[oklch(0.78_0.075_82)]">Inviter</Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Un email d&apos;invitation est envoyé. Le compte et le lien d&apos;accès sont créés automatiquement.</p>
          </form>
        </Card>
      </div>
    </>
  );
}
