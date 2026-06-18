-- 0033 — Avant-première / la Liste
--
-- La phase « Avant-première » donne à la Liste (inscrits waitlist) un accès
-- anticipé aux prochains drops, avant l'annonce publique (cf.
-- docs/cycle-de-vie-drop.md). Le gating d'appartenance est exposé via une
-- fonction SECURITY DEFINER : elle ne révèle qu'un booléen sur l'email de
-- l'appelant, sans jamais ouvrir la table waitlist (RLS intacte).

create or replace function public.am_i_on_the_list()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.waitlist
    where lower(email) = lower(auth.email())
      and status = 'subscribed'
  );
$$;

comment on function public.am_i_on_the_list() is
  'Avant-première : l''appelant authentifié est-il un membre actif de la Liste (waitlist subscribed) ? Booléen uniquement, sur son propre email.';

-- Personne d'autre que l'utilisateur connecté (anon = email nul = false).
revoke all on function public.am_i_on_the_list() from public;
revoke all on function public.am_i_on_the_list() from anon;
grant execute on function public.am_i_on_the_list() to authenticated;
