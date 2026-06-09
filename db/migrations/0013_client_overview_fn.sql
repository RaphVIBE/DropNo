-- 0013_client_overview_fn.sql
-- Agrégés par client pour le back-office (admin-plateforme uniquement) :
-- nb d'enchères, nb de commandes capturées, total dépensé. Évite les N+1.

create or replace function public.get_client_overview()
returns table (
  id uuid, email text, display_name text, kyc_status text,
  newsletter_subscribed boolean, created_at timestamptz,
  bids_count bigint, orders_count bigint, total_spent_cents bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select p.id, p.email, p.display_name, p.kyc_status, p.newsletter_subscribed, p.created_at,
    (select count(*) from bids b where b.user_id = p.id),
    (select count(*) from transactions t where t.user_id = p.id and t.status = 'captured'),
    (select coalesce(sum(t.amount_paid_cents),0) from transactions t where t.user_id = p.id and t.status = 'captured')
  from profiles p
  order by p.created_at desc;
end $$;

revoke all on function public.get_client_overview() from public, anon;
grant execute on function public.get_client_overview() to authenticated;
