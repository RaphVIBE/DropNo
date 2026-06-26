-- 0039 — Détection d'ouverture des démos prospects.
--
-- Chaque ouverture d'un lien démo (`/demo/[slug]` ou `/demo/[slug]/maison`) avec
-- une clé valide écrit une ligne ici. Permet de savoir quel prospect a ouvert sa
-- démo, et quand. Lecture réservée aux admins plateforme ; écriture uniquement
-- via la fonction `log_demo_visit` (security definer) — la table n'est jamais
-- exposée en écriture directe au client (même schéma que waitlist/drop_alerts).

create table if not exists public.demo_visits (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  surface     text not null default 'drop' check (surface in ('drop', 'maison')),
  locale      text not null default 'fr' check (locale in ('fr', 'en')),
  ip          text,
  user_agent  text,
  path        text,
  opened_at   timestamptz not null default now()
);

create index if not exists demo_visits_slug_opened_idx
  on public.demo_visits (slug, opened_at desc);
create index if not exists demo_visits_opened_idx
  on public.demo_visits (opened_at desc);

alter table public.demo_visits enable row level security;
alter table public.demo_visits force row level security;

-- Deny-all par défaut (aucune policy write). Lecture : admins plateforme.
drop policy if exists demo_visits_admin_select on public.demo_visits;
create policy demo_visits_admin_select on public.demo_visits
  for select
  using (public.is_platform_admin());

-- Seul writer : fonction security definer, search_path verrouillé.
create or replace function public.log_demo_visit(
  p_slug   text,
  p_surface text,
  p_locale text,
  p_ip     text,
  p_ua     text,
  p_path   text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.demo_visits (slug, surface, locale, ip, user_agent, path)
  values (
    p_slug,
    case when p_surface in ('drop', 'maison') then p_surface else 'drop' end,
    case when p_locale in ('fr', 'en') then p_locale else 'fr' end,
    nullif(p_ip, ''),
    nullif(p_ua, ''),
    nullif(p_path, '')
  );
end;
$$;

revoke all on function public.log_demo_visit(text, text, text, text, text, text) from public;
grant execute on function public.log_demo_visit(text, text, text, text, text, text) to anon, authenticated;
