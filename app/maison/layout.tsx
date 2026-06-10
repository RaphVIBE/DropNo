import { redirect } from "next/navigation";

import { getRole } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function MaisonLayout({ children }: { children: React.ReactNode }) {
  const role = await getRole();
  // Réservé aux responsables de maison (et aux opérateurs, pour supervision).
  if (role.kind === "none") {
    if (role.userId) redirect("/account");
    redirect("/login?redirect=/maison");
  }

  return (
    <div className="admin min-h-screen bg-background font-sans text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-10">
        <div>
          <div className="font-display text-2xl leading-none">Drop №</div>
          <div className="eyebrow mt-1">Espace maison</div>
        </div>
        <form action={signOut}>
          <button className="text-sm text-muted-foreground transition-colors hover:text-foreground">Se déconnecter</button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}
