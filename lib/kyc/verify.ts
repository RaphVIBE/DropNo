import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/types";

export type IdentityProvider = "stripe" | "itsme";

/**
 * Marque un profil comme KYC-vérifié, via le SERVICE ROLE.
 *
 * Point d'entrée unique de la substitution KYC : utilisable par le futur
 * callback itsme (broker Signicat) comme par le webhook Stripe. Les colonnes
 * kyc_* sont verrouillées pour l'utilisateur (migration 0027) ; cette écriture
 * DOIT donc passer par le service role, et l'appelant DOIT avoir authentifié
 * et vérifié l'identité de `userId` en amont (jamais sur entrée client brute).
 *
 * @param attributes Claims d'identité vérifiés (itsme) pour la piste d'audit AML.
 *                   Optionnel : Stripe Identity n'expose pas ces attributs.
 */
export async function markIdentityVerified(
  userId: string,
  provider: IdentityProvider,
  attributes?: Json
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("profiles")
    .update({
      kyc_status: "verified",
      kyc_verified_at: new Date().toISOString(),
      kyc_provider: provider,
      ...(attributes !== undefined ? { identity_attributes: attributes } : {}),
    })
    .eq("id", userId);
}
