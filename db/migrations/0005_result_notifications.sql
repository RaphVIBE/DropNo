-- =====================================================================
-- Drop No. — Support des emails de résultat (US-22)
-- =====================================================================
-- Idempotence : on marque le drop une fois les emails de résultat envoyés,
-- pour qu'un re-run de close-drop (idempotent) ne renvoie pas les emails.
alter table public.drops
  add column if not exists result_notified_at timestamptz;

-- Destinataires des emails de résultat : gagnants/perdants + leur email.
-- SECURITY DEFINER pour lire auth.users (l'email n'est pas exposé via PostgREST).
-- Réservé au service role (REVOKE anon/authenticated).
create or replace function public.drop_result_recipients(p_drop_id uuid)
returns table(user_id uuid, email text, status text)
language sql
security definer
set search_path = public
as $$
  select b.user_id, u.email::text, b.status
  from public.bids b
  join auth.users u on u.id = b.user_id
  where b.drop_id = p_drop_id
    and b.status in ('won', 'lost');
$$;

revoke all on function public.drop_result_recipients(uuid) from anon, authenticated, public;
