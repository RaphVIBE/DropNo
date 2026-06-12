import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  DashboardView,
  type BidRow,
  type TxRow,
  type DeliveryRow,
} from "@/components/account/dashboard-view";

export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardPage() {
  const t = await getTranslations("accountDashboard");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Le middleware protege deja /account, mais on garde une garde explicite.
  if (!user) redirect("/login");

  // RLS : chaque requete ne renvoie que les lignes de l'utilisateur.
  const [{ data: profile }, bidsRes, txRes, delRes, offerRes] = await Promise.all([
    supabase.from("profiles").select("display_name, kyc_status").eq("id", user.id).maybeSingle(),
    supabase
      .from("bids")
      .select(
        "id, amount_cents, status, submitted_at, drop:drops(id, drop_number, title, clearing_price_cents)"
      )
      .order("submitted_at", { ascending: false }),
    supabase
      .from("transactions")
      .select(
        "id, amount_paid_cents, status, captured_at, withdrawal_window_ends_at, drop:drops(id, drop_number, title)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("deliveries")
      .select(
        "id, carrier, tracking_number, status, transaction:transactions(drop:drops(id, drop_number, title))"
      )
      .order("created_at", { ascending: false }),
    // Privilège № 001 en attente (RLS : la sienne uniquement).
    supabase
      .from("serial_offers")
      .select("id, expires_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <DashboardView
      data={{
        email: user.email ?? "",
        displayName: profile?.display_name ?? null,
        kycStatus: profile?.kyc_status ?? "pending",
        bids: (bidsRes.data ?? []) as unknown as BidRow[],
        txs: (txRes.data ?? []) as unknown as TxRow[],
        deliveries: (delRes.data ?? []) as unknown as DeliveryRow[],
        serialOffer: offerRes.data ?? null,
      }}
      footer={
        <form action={signOut}>
          <Button type="submit" variant="outline">
            {t("signOut")}
          </Button>
        </form>
      }
    />
  );
}
