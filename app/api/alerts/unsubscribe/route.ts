import { NextResponse, type NextRequest } from "next/server";

import { alertsClient, siteUrl } from "@/lib/alerts";

export const dynamic = "force-dynamic";

/** Désinscription via le jeton (présent dans chaque email d'alerte). */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.redirect(`${siteUrl()}/?alert=invalid`);
  }

  const alerts = alertsClient();
  const { data: row } = await alerts
    .from("drop_alerts")
    .select("id, drop_id")
    .eq("confirm_token", token)
    .maybeSingle();

  if (!row) {
    return NextResponse.redirect(`${siteUrl()}/?alert=invalid`);
  }

  await alerts
    .from("drop_alerts")
    .update({ status: "unsubscribed" })
    .eq("id", row.id);

  return NextResponse.redirect(`${siteUrl()}/drop/${row.drop_id}?alert=off`);
}
