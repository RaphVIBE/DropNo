-- 0030 — Liste d'attente (waitlist) du soft launch.
--
-- Capture d'email avant le premier drop, visiteur sans compte. Opt-in simple
-- avec consentement marketing explicite (case à cocher côté UI ; base légale
-- RGPD = consentement). Le `token` sert aux liens de désinscription.
--
-- Deny-all RLS (aucune policy) : seul le service role (API /api/waitlist)
-- lit/écrit, comme drop_alerts. La table n'est pas exposée au client.

create table if not exists public.waitlist (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  locale          text not null default 'fr' check (locale in ('fr', 'en')),
  status          text not null default 'subscribed'
                    check (status in ('subscribed', 'unsubscribed')),
  token           text not null,
  source          text,
  created_at      timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index if not exists waitlist_token_idx on public.waitlist (token);

alter table public.waitlist enable row level security;
alter table public.waitlist force row level security;
