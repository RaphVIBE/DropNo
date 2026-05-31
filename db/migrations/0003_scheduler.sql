-- =====================================================================
-- Drop No. — Scheduler pg_cron pour dispatcher les drops mûrs
-- =====================================================================
-- Nécessite les extensions pg_cron et pg_net activées
-- (Dashboard Supabase → Database → Extensions).
--
-- Avant d'appliquer : configurer les settings avec service_role_key.
-- Voir db/README.md.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ---------------------------------------------------------------------
-- Fonction qui dispatch chaque minute les drops à reveal_at expiré
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
  -- Lecture des settings (à configurer une fois via ALTER DATABASE)
  v_edge_url := current_setting('app.settings.edge_function_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  IF v_edge_url IS NULL OR v_service_key IS NULL THEN
    RAISE EXCEPTION 'app.settings.edge_function_url ou app.settings.service_role_key non configurés. Voir db/README.md.';
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

-- ---------------------------------------------------------------------
-- Schedule cron chaque minute
-- ---------------------------------------------------------------------
-- Note : cron.schedule est idempotent par jobname.
SELECT cron.schedule(
  'dispatch_ripe_drops_every_minute',
  '* * * * *',
  $cron$SELECT public.dispatch_ripe_drops();$cron$
);

-- Pour inspecter les jobs :
--   SELECT * FROM cron.job;
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Pour désactiver temporairement :
--   SELECT cron.unschedule('dispatch_ripe_drops_every_minute');
