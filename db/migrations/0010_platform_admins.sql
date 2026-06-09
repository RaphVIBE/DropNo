-- 0010_platform_admins.sql
-- Rôle admin-plateforme (l'opérateur / back-office), distinct de brand_admins
-- (côté maison). Sert de fondation au back-office : garde de rôle + helper
-- réutilisable dans la RLS des autres tables.

create table if not exists public.platform_admins (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner','staff')),
  created_at timestamptz not null default now()
);

comment on table public.platform_admins is
  'Opérateurs de la plateforme (back-office). Distinct de brand_admins qui scope les responsables de maison à leur marque.';

alter table public.platform_admins enable row level security;

-- SECURITY DEFINER pour pouvoir être réutilisé dans la RLS d'autres tables
-- sans récursion. search_path figé à public.
create or replace function public.is_platform_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.platform_admins pa where pa.user_id = uid);
$$;

-- anon n'a aucune raison d'appeler ceci ; réservé aux utilisateurs connectés.
revoke all on function public.is_platform_admin(uuid) from public, anon;
grant execute on function public.is_platform_admin(uuid) to authenticated;

-- Seuls les admins lisent la liste. Les écritures passent par le service role.
drop policy if exists "platform_admins_select" on public.platform_admins;
create policy "platform_admins_select" on public.platform_admins
  for select to authenticated
  using (public.is_platform_admin());

-- Bootstrap (à lancer une fois, remplacer l'email) :
-- insert into public.platform_admins (user_id)
-- select id from public.profiles where email = 'raph@veracruz.be'
-- on conflict do nothing;
