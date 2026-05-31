-- =====================================================================
-- Drop No. — durcissement sécurité post-init
-- =====================================================================
-- Corrige les advisories Supabase de la migration 0001 :
--   1. view security_definer → security_invoker
--   2. functions sans search_path fixé → SET search_path = public
--   3. fonctions SECURITY DEFINER exposées via RPC → REVOKE explicite
--   4. bid_audit_log sans policies → deny-all explicite
-- =====================================================================

-- 1. drops_public en SECURITY INVOKER (sinon contourne RLS du caller)
DROP VIEW IF EXISTS public.drops_public;
CREATE VIEW public.drops_public WITH (security_invoker = true) AS
SELECT id, drop_number, brand_id, title, piece_reference, description,
  floor_price_cents, exemplaires, bid_window_opens_at, reveal_at, bid_lock_at, status,
  CASE WHEN status = 'revealed' THEN clearing_price_cents ELSE NULL END AS clearing_price_cents,
  bid_count, hero_image_url, images_urls, specs, revealed_at
FROM public.drops
WHERE status IN ('scheduled','open','closed','revealed');

GRANT SELECT ON public.drops_public TO anon, authenticated;

-- 2. search_path fixe sur toutes les fonctions (anti search_path hijack)
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.set_drops_bid_lock_at() SET search_path = public;
ALTER FUNCTION public.update_drop_bid_count() SET search_path = public;
ALTER FUNCTION public.prevent_bid_immutable_change() SET search_path = public;
ALTER FUNCTION public.log_bid_change() SET search_path = public;
ALTER FUNCTION public.my_bid_for_drop(UUID) SET search_path = public;
-- public.close_drop a déjà SET search_path = public dans sa définition.

-- 3. Révoquer EXECUTE explicite pour anon/authenticated sur fonctions sensibles
-- Supabase grant à anon/authenticated par défaut, REVOKE FROM PUBLIC seul ne suffit pas.
-- Les fonctions trigger ne sont pas affectées (le système trigger n'utilise pas le rôle JWT).
REVOKE ALL ON FUNCTION public.close_drop(UUID) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.log_bid_change() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.update_drop_bid_count() FROM anon, authenticated, PUBLIC;

-- 4. Deny-all explicite sur bid_audit_log
-- Le trigger log_bid_change() (SECURITY DEFINER, owner postgres avec BYPASSRLS) écrit quand même.
CREATE POLICY bid_audit_log_no_access ON public.bid_audit_log FOR SELECT USING (false);
CREATE POLICY bid_audit_log_no_insert ON public.bid_audit_log FOR INSERT WITH CHECK (false);
CREATE POLICY bid_audit_log_no_update ON public.bid_audit_log FOR UPDATE USING (false);
CREATE POLICY bid_audit_log_no_delete ON public.bid_audit_log FOR DELETE USING (false);

-- =====================================================================
-- FIN migration 0002
-- =====================================================================
