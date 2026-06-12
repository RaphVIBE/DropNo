-- 0020 — Rappel T−72h pour les drops « exceptionnel ».
--
-- Les drops exceptionnels ont une fenêtre longue (10 j) : on ajoute un rappel
-- 72h avant le reveal, en plus de open / T−24h / T−1h. Le rappel n'est émis que
-- pour format = 'exceptionnel' (CASE → NULL filtré pour les autres).

-- 1. Autoriser le nouveau kind dans le suivi d'idempotence (max 5/drop désormais).
ALTER TABLE public.drop_notifications
  DROP CONSTRAINT IF EXISTS drop_notifications_kind_check;
ALTER TABLE public.drop_notifications
  ADD CONSTRAINT drop_notifications_kind_check
  CHECK (kind IN ('open', 'h72', 'h24', 'h1', 'result'));

-- 2. reminders_due() : h72 conditionnel au format exceptionnel.
CREATE OR REPLACE FUNCTION public.reminders_due()
RETURNS TABLE(drop_id uuid, kind text, drop_number integer, title text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, k.kind, d.drop_number, d.title
  FROM public.drops d
  CROSS JOIN LATERAL (VALUES
    ('open', d.bid_window_opens_at),
    ('h72', CASE WHEN d.format = 'exceptionnel' THEN d.reveal_at - interval '72 hours' END),
    ('h24', d.reveal_at - interval '24 hours'),
    ('h1', d.reveal_at - interval '1 hour')
  ) AS k(kind, trigger_at)
  WHERE d.status = 'open'
    AND k.trigger_at IS NOT NULL
    AND now() >= k.trigger_at
    AND now() < d.reveal_at
    AND NOT EXISTS (
      SELECT 1 FROM public.drop_notifications n
      WHERE n.drop_id = d.id AND n.kind = k.kind
    );
$$;
REVOKE ALL ON FUNCTION public.reminders_due() FROM anon, authenticated, public;
