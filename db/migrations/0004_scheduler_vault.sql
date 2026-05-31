-- =====================================================================
-- Drop No. — Scheduler : lecture des secrets via Supabase Vault
-- =====================================================================
-- Correctif de 0003 : sur ce projet Supabase le role `postgres` n'est PAS
-- superuser et ne peut pas executer `ALTER DATABASE/ROLE postgres SET
-- app.settings.*` (permission denied). On abandonne donc les GUC custom au
-- profit de Supabase Vault, qui est la voie supportee pour stocker des secrets
-- consommes par pg_cron / pg_net.
--
-- Prerequis (une seule fois) :
--   select vault.create_secret('https://<ref>.supabase.co', 'edge_function_url', '...');
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key', '...');
-- Puis reactiver le cron :
--   select cron.alter_job(
--     (select jobid from cron.job where jobname = 'dispatch_ripe_drops_every_minute'),
--     active := true);
--
-- La fonction est SECURITY DEFINER (owner postgres) -> acces a Vault OK.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.dispatch_ripe_drops()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_drop_id UUID;
  v_count INTEGER := 0;
  v_edge_url TEXT;
  v_service_key TEXT;
BEGIN
  SELECT decrypted_secret INTO v_edge_url
    FROM vault.decrypted_secrets WHERE name = 'edge_function_url';
  SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  IF v_edge_url IS NULL OR v_service_key IS NULL THEN
    RAISE EXCEPTION 'Secrets Vault edge_function_url / service_role_key manquants. Voir supabase/README.md.';
  END IF;

  FOR v_drop_id IN
    SELECT id FROM public.drops
    WHERE status IN ('open', 'closed')
      AND reveal_at <= now()
      AND clearing_price_cents IS NULL  -- pas encore traité
    ORDER BY reveal_at ASC
    LIMIT 10  -- max 10 drops par minute (safety)
  LOOP
    PERFORM net.http_post(
      url := v_edge_url || '/functions/v1/close-drop',
      body := jsonb_build_object('drop_id', v_drop_id),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_service_key,
        'Content-Type', 'application/json'
      ),
      timeout_milliseconds := 30000
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('dispatched', v_count, 'at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_ripe_drops() FROM anon, authenticated, PUBLIC;
