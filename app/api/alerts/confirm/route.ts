import { NextResponse, type NextRequest } from "next/server";

import { alertsClient, siteUrl } from "@/lib/alerts";

export const dynamic = "force-dynamic";

/** Double opt-in : active l'alerte correspondant au jeton, puis redirige. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.redirect(`${siteUrl()}/?alert=invalid`);
  }

  const alerts = alertsClient();
  const { data: row } = await alerts
    .from("drop_alerts")
    .select("id, drop_id, status")
    .eq("confirm_token", token)
    .maybeSingle();

  if (!row) {
    return NextResponse.redirect(`${siteUrl()}/?alert=invalid`);
  }

  if (row.status !== "unsubscribed") {
    await alerts
      .from("drop_alerts")
      .update({ status: "active", confirmed_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  return NextResponse.redirect(`${siteUrl()}/drop/${row.drop_id}?alert=confirmed`);
}
