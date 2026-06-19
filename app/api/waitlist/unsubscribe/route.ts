import { NextResponse, type NextRequest } from "next/server";

import { alertsClient, siteUrl } from "@/lib/alerts";

export const dynamic = "force-dynamic";

/** Désinscrit le membre porteur du jeton. Retourne true si une ligne a bougé. */
async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!token) return false;
  const db = alertsClient();
  const { data: row } = await db
    .from("waitlist")
    .select("id")
    .eq("token", token)
    .maybeSingle();
  if (!row) return false;
  await db
    .from("waitlist")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("id", row.id);
  return true;
}

/** Lien humain dans l'email : désinscrit puis renvoie sur la home avec un état. */
export async function GET(request: NextRequest) {
  const ok = await unsubscribeByToken(request.nextUrl.searchParams.get("token") ?? "");
  return NextResponse.redirect(`${siteUrl()}/?list=${ok ? "off" : "invalid"}`);
}

/**
 * One-click RFC 8058 : Gmail/Yahoo POSTent ici (corps `List-Unsubscribe=One-Click`)
 * sans interaction. On désinscrit et on répond 200, sans redirection.
 */
export async function POST(request: NextRequest) {
  const ok = await unsubscribeByToken(request.nextUrl.searchParams.get("token") ?? "");
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
