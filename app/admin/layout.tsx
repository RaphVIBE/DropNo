import { redirect } from "next/navigation";

import { getRole } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/nav";

export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getRole();
  // Le middleware protège déjà /admin (session) ; ici on exige le rôle opérateur.
  if (role.kind !== "platform_admin") {
    if (role.userId) redirect("/"); // connecté mais non autorisé
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="admin min-h-screen bg-background font-sans text-foreground">
      <div className="grid grid-cols-1 md:grid-cols-[244px_1fr]">
        <aside className="hidden border-r border-border bg-card/40 md:flex md:min-h-screen md:flex-col md:p-4">
          <div className="px-2 py-3">
            <div className="font-display text-2xl leading-none">Drop №</div>
            <div className="eyebrow mt-1">Back-office</div>
          </div>
          <div className="mt-4 flex-1">
            <AdminNav />
          </div>
          <form action={signOut} className="border-t border-border pt-3">
            <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
              Se déconnecter
            </button>
          </form>
        </aside>

        <main className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
