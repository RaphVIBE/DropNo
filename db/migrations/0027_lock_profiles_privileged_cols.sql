-- 0027 — Verrou anti-bypass KYC sur public.profiles.
--
-- FAILLE (corrigée ici) : la policy `profiles_update_own` autorise un UPDATE de
-- sa propre row SANS restriction de colonne, et le rôle `authenticated` détient
-- le privilège UPDATE sur toutes les colonnes — dont `kyc_status`. Un utilisateur
-- authentifié pouvait donc exécuter, depuis le client :
--     update profiles set kyc_status = 'verified' where id = auth.uid();
-- et passer la garde `bids_insert_own_kyc` (qui exige kyc_status='verified')
-- pour enchérir SANS aucune vérification d'identité → contournement KYC/AML.
--
-- CORRECTIF : on retire l'UPDATE au niveau table et on ne re-grant que les
-- colonnes réellement éditables par l'utilisateur. Les colonnes privilégiées
-- (kyc_status, kyc_verified_at, kyc_stripe_session_id, stripe_customer_id,
-- email) ne sont plus modifiables que par le service role (webhook Stripe,
-- routes serveur identity-session / bids basculées sur le service client).
--
-- La policy RLS profiles_update_own reste en place (un user ne touche que sa
-- row) ; ce sont les grants colonne qui bornent désormais CE qu'il peut changer.

REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT UPDATE (display_name, newsletter_subscribed) ON public.profiles TO authenticated;
