-- 0034 — Avant-première : push email à la Liste (palier 2)
--
-- Quand un drop entre dans sa fenêtre d'avant-première, la Liste (waitlist
-- subscribed) reçoit un teaser par email. Calqué sur dispatch_reminders :
-- cron pg_cron -> fonction SQL -> ping de l'endpoint Next, qui envoie via Resend
-- et marque l'idempotence. Cron créé INACTIF (à activer au lancement).

-- Idempotence : un seul push d'avant-première par drop.
create table if not exists public.avant_premiere_sent (
  drop_id uuid primary key references public.drops(id) on delete cascade,
  sent_at timestamptz not null default now()
);
alter table public.avant_premiere_sent enable row level security;
-- Aucune policy : table interne, accès service_role uniquement (deny-all).

-- Drops entrant en avant-première : programmés, non démo, dans la fenêtre
-- [ouverture − (annonce+preview), ouverture − annonce[, pas encore poussés.
-- ⚠️ Les leads par format dupliquent DROP_FORMATS (lib/admin/drops.ts) — source
-- de vérité côté produit ; garder les deux alignés.
create or replace function public.drops_entering_preview()
returns table (
  drop_id uuid,
  drop_number integer,
  title text,
  brand_name text,
  opening_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select d.id, d.drop_number, d.title, b.name, d.bid_window_opens_at
  from public.drops d
  left join public.brands b on b.id = d.brand_id
  where d.status = 'scheduled'
    and d.is_demo = false
    and d.bid_window_opens_at is not null
    and now() >= d.bid_window_opens_at
        - (case when d.format = 'exceptionnel' then interval '39 days' else interval '21 days' end)
    and now() <  d.bid_window_opens_at
        - (case when d.format = 'exceptionnel' then interval '25 days' else interval '14 days' end)
    and not exists (
      select 1 from public.avant_premiere_sent s where s.drop_id = d.id
    );
$$;

-- Marque un drop comme « avant-première poussée » (idempotent).
create or replace function public.mark_preview_sent(p_drop_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.avant_premiere_sent (drop_id)
  values (p_drop_id)
  on conflict (drop_id) do nothing;
$$;

revoke all on function public.drops_entering_preview() from public, anon, authenticated;
revoke all on function public.mark_preview_sent(uuid) from public, anon, authenticated;
grant execute on function public.drops_entering_preview() to service_role;
grant execute on function public.mark_preview_sent(uuid) to service_role;

-- Cron : pinge l'endpoint Next (mêmes secrets Vault que dispatch_reminders).
create or replace function public.dispatch_avant_premiere()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app_url text;
  v_secret text;
begin
  select decrypted_secret into v_app_url from vault.decrypted_secrets where name = 'app_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'notify_secret';
  if v_app_url is null or v_secret is null then
    raise exception 'Secrets Vault app_url / notify_secret manquants.';
  end if;
  perform net.http_post(
    url := v_app_url || '/api/notifications/avant-premiere',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  return jsonb_build_object('pinged_at', now());
end;
$$;

do $$
declare jid bigint;
begin
  if exists (select 1 from cron.job where jobname = 'dispatch_avant_premiere_every_15_min') then
    return;
  end if;
  jid := cron.schedule(
    'dispatch_avant_premiere_every_15_min',
    '*/15 * * * *',
    $cron$select public.dispatch_avant_premiere();$cron$
  );
  perform cron.alter_job(jid, active := false); -- créé inactif (activer au lancement)
end $$;
