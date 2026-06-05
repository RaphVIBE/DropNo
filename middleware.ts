import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { constructionGate } from "@/lib/construction-gate";

export async function middleware(request: NextRequest) {
  // Barrière "site en construction" (avant la session Supabase).
  const gated = constructionGate(request);
  if (gated) return gated;

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - _next/static, _next/image
     * - favicon.ico, fichiers d'images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
