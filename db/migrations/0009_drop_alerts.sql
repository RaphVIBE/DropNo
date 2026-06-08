-- 0009_drop_alerts.sql
-- Alertes "montre" pour visiteurs sans compte (double opt-in).
-- Quiconque peut demander à être prévenu de l'ouverture d'un drop et/ou de la
-- dernière heure avant clôture. L'email n'est armé qu'après confirmation.
--
-- Sécurité : table en deny-all (comme audit_log). Aucune policy -> seul le
-- service role (API /api/alerts + cron) lit/écrit. Les emails ne sont jamais
-- exposés à un client.

create table if not exists public.drop_alerts (
  id            uuid primary key default gen_random_uuid(),
  drop_id       uuid not null references public.drops(id) on delete cascade,
  email         text not null,
  notify_open   boolean not null default false,
  notify_lock   boolean not null default false,
  status        text not null default 'pending',   -- pending | active | unsubscribed
  confirm_token text not null,
  created_at    timestamptz not null default now(),
  confirmed_at  timestamptz,
  open_sent_at  timestamptz,
  lock_sent_at  timestamptz,
  constraint drop_alerts_one_trigger check (notify_open or notify_lock),
  constraint drop_alerts_status_chk check (status in ('pending','active','unsubscribed')),
  unique (drop_id, email)
);

create index if not exists drop_alerts_active_idx
  on public.drop_alerts (status) where status = 'active';
create index if not exists drop_alerts_token_idx
  on public.drop_alerts (confirm_token);

alter table public.drop_alerts enable row level security;
alter table public.drop_alerts force row level security;
revoke all on public.drop_alerts from anon, authenticated;
-- (pas de policy = deny-all ; le service role contourne la RLS)
