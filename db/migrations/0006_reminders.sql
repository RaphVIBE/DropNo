-- =====================================================================
-- Drop No. — Rappels événementiels (US-22) : ouverture / T-24h / T-1h
-- =====================================================================

-- Suivi des notifications envoyées (idempotence + rate-limit max 4/drop :
-- open, h24, h1, result). Service role only (RLS sans policy).
create table if not exists public.drop_notifications (
  drop_id uuid not null references public.drops(id) on delete cascade,
  kind text not null check (kind in ('open', 'h24', 'h1', 'result')),
  sent_at timestamptz not null default now(),
  primary key (drop_id, kind)
);
alter table public.drop_notifications enable row level security;

-- Destinataires d'un rappel : followers du drop UNION bidders actifs (distinct).
-- SECURITY DEFINER pour lire auth.users ; service role only.
create or replace function public.drop_notification_recipients(p_drop_id uuid)
returns table(user_id uuid, email text)
language sql
security definer
set search_path = public
as $$
  select u.id, u.email::text
  from auth.users u
  where u.id in (
    select f.user_id from public.drop_follows f where f.drop_id = p_drop_id
    union
    select b.user_id from public.bids b
      where b.drop_id = p_drop_id and b.status = 'active'
  );
$$;
revoke all on function public.drop_notification_recipients(uuid) from anon, authenticated, public;

-- Rappels dus maintenant et pas encore envoyés. Gate sur status='open'
-- (le drop doit être ouvert aux offres). Fenêtres : ouverture, T-24h, T-1h.
create or replace function public.reminders_due()
returns table(drop_id uuid, kind text, drop_number integer, title text)
language sql
security definer
set search_path = public
as $$
  select d.id, k.kind, d.drop_number, d.title
  from public.drops d
  cross join lateral (values
    ('open', d.bid_window_opens_at),
    ('h24', d.reveal_at - interval '24 hours'),
    ('h1', d.reveal_at - interval '1 hour')
  ) as k(kind, trigger_at)
  where d.status = 'open'
    and now() >= k.trigger_at
    and now() < d.reveal_at
    and not exists (
      select 1 from public.drop_notifications n
      where n.drop_id = d.id and n.kind = k.kind
    );
$$;
revoke all on function public.reminders_due() from anon, authenticated, public;

-- Pinger pg_cron -> route Next /api/notifications/reminders (secrets via Vault).
create or replace function public.dispatch_reminders()
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
    raise exception 'Secrets Vault app_url / notify_secret manquants. Voir LANCEMENT.md.';
  end if;
  perform net.http_post(
    url := v_app_url || '/api/notifications/reminders',
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
revoke all on function public.dispatch_reminders() from anon, authenticated, public;

-- Cron toutes les 5 min, créé DÉSACTIVÉ (mode sûr tant que les secrets Vault
-- app_url / notify_secret ne sont pas configurés).
do $$
declare jid bigint;
begin
  jid := cron.schedule(
    'dispatch_reminders_every_5_min',
    '*/5 * * * *',
    $cron$select public.dispatch_reminders();$cron$
  );
  perform cron.alter_job(jid, active := false);
end $$;
