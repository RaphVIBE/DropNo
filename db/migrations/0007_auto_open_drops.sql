-- =====================================================================
-- Drop No. — Ouverture automatique des drops (lifecycle scheduled -> open)
-- =====================================================================
-- Comble le gap : rien ne faisait passer un drop 'scheduled' à 'open' à
-- bid_window_opens_at. Pur SQL (pas de Stripe/email/HTTP) -> aucun secret
-- requis, le cron est ACTIF immédiatement et sans risque.

create or replace function public.open_ripe_drops()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with opened as (
    update public.drops
    set status = 'open'
    where status = 'scheduled'
      and bid_window_opens_at <= now()
      and reveal_at > now()
    returning id
  )
  select count(*) into v_count from opened;
  return jsonb_build_object('opened', v_count, 'at', now());
end;
$$;

revoke all on function public.open_ripe_drops() from anon, authenticated, public;

-- Cron chaque minute, ACTIF (auto-contenu, pas de secret).
select cron.schedule(
  'open_ripe_drops_every_minute',
  '* * * * *',
  $cron$select public.open_ripe_drops();$cron$
);
