-- =====================================================================
-- Drop No. — Scheduler pg_cron pour dispatcher les drops mûrs
-- =====================================================================
-- Lit l'URL projet et le service_role_key depuis Supabase Vault (le rôle
-- postgres n'est pas superuser sur Supabase, ALTER DATABASE/ROLE échoue
-- avec "permission denied").
--
-- Prérequis :
--   1. Extensions pg_cron, pg_net, supabase_vault activées (déjà fait
--      sur ygzyzvjxregoqbzmcmyq au 2026-05-30).
--   2. Vault secrets créés (voir supabase/README.md §2) :
--        - edge_function_url  (non sensible, peut être créé via MCP)
--        - service_role_key   (sensible, créé par le user dans SQL Editor)
--   3. Edge function close-drop déployée.
--
-- Le cron job est créé ACTIF. En cas de doute, désactiver immédiatement
-- avec cron.alter_job(jobid, active := false) jusqu'à ce que les secrets
-- soient en place.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ---------------------------------------------------------------------
-- Fonction dispatcher : scan les drops mûrs et trigger l'edge function
-- ---------------------------------------------------------------------
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
  -- Lecture des secrets depuis Vault
  SELECT decrypted_secret INTO v_edge_url
    FROM vault.decrypted_secrets WHERE name = 'edge_function_url';
  SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  IF v_edge_url IS NULL OR v_service_key IS NULL THEN
    RAISE EXCEPTION 'Secrets Vault edge_function_url / service_role_key manquants. Voir supabase/README.md.';
  END IF;

  -- Drops à clôturer : open ou closed, reveal_at dépassé, pas encore traité
  FOR v_drop_id IN
    SELECT id FROM public.drops
    WHERE status IN ('open', 'closed')
      AND reveal_at <= now()
      AND clearing_price_cents IS NULL
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

-- ---------------------------------------------------------------------
-- Schedule cron toutes les minutes (créé désactivé en mode sûr)
-- Réactiver avec : cron.alter_job(jobid, active := true) une fois les
-- secrets Vault en place.
-- ---------------------------------------------------------------------
SELECT cron.schedule(
  'dispatch_ripe_drops_every_minute',
  '* * * * *',
  $cron$SELECT public.dispatch_ripe_drops();$cron$
);

-- Désactivation immédiate (à inverser après config secrets)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'dispatch_ripe_drops_every_minute'),
  active := false
);

-- Inspection utile :
--   SELECT jobid, schedule, active FROM cron.job;
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--   SELECT name, description FROM vault.secrets;
