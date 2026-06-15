import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Accès démo prospect.
 *
 * `/demo/<slug>?key=<DEMO_KEY>` : si la clé est bonne, pose un cookie de courte
 * durée `dropno_demo` (4h) et redirige vers la fiche du drop démo de la maison
 * <slug>. Le cookie n'ouvre QUE les fiches /drop/* à travers la barrière
 * SITE_LOCKED (voir lib/construction-gate.ts) — le reste de la vitrine reste
 * verrouillé. Les drops démo (is_demo = true) ne sont jamais listés ni traités
 * par les crons (voir migration 0030).
 *
 * Clé absente ou maison/drop introuvable -> 404 neutre (on ne révèle rien).
 */

export const dynamic = "force-dynamic";

const DEMO_COOKIE = "dropno_demo";
const FOUR_HOURS = 60 * 60 * 4;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const key = request.nextUrl.searchParams.get("key");
  const expected = process.env.DEMO_KEY;

  if (!expected || !key || key !== expected) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = createClient();

  // Maison démo correspondant au slug.
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", params.slug)
    .eq("is_demo", true)
    .maybeSingle();

  if (!brand) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Son drop démo le plus récent (visible via drops_public : statut éligible).
  const { data: drop } = await supabase
    .from("drops_public")
    .select("id")
    .eq("brand_id", brand.id)
    .eq("is_demo", true)
    .order("drop_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!drop?.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Fiche drop FR (locale par défaut, servie à la racine sans préfixe).
  const target = request.nextUrl.clone();
  target.pathname = `/drop/${drop.id}`;
  target.search = "";

  const res = NextResponse.redirect(target);
  res.cookies.set(DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: FOUR_HOURS,
  });
  return res;
}
