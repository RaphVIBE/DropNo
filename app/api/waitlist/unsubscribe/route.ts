import { NextResponse, type NextRequest } from "next/server";

import { alertsClient, siteUrl } from "@/lib/alerts";

export const dynamic = "force-dynamic";

/** Désinscription de la Liste via le jeton présent dans chaque email. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.redirect(`${siteUrl()}/?list=invalid`);
  }

  const db = alertsClient();
  const { data: row } = await db
    .from("waitlist")
    .select("id")
    .eq("token", token)
    .maybeSingle();

  if (!row) {
    return NextResponse.redirect(`${siteUrl()}/?list=invalid`);
  }

  await db
    .from("waitlist")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("id", row.id);

  return NextResponse.redirect(`${siteUrl()}/?list=off`);
}
