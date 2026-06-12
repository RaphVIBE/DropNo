import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { VerificationView } from "@/components/account/verification-view";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account/verification");

  const { data: profile } = await supabase
    .from("profiles")
    .select("kyc_status")
    .eq("id", user.id)
    .maybeSingle();

  return <VerificationView status={profile?.kyc_status ?? "pending"} />;
}
