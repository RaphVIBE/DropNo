import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Refus du Privilège № 001 (« Conserver mon numéro attribué »).
 *
 * decline_serial_offer s'exécute avec la session de l'utilisateur :
 * la fonction SQL vérifie elle-même user_id = auth.uid() et le statut
 * pending. Aucune cascade vers le rang 2 (voir Privilege_001.md).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("decline_serial_offer", {
    p_offer_id: params.id,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const result = data as { ok: boolean; reason?: string };
  if (!result.ok) {
    return NextResponse.json(
      { error: "Cette offre n'est plus disponible." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
