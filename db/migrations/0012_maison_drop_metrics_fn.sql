-- 0012_maison_drop_metrics_fn.sql
-- Agrégés maison calculés côté serveur avec des droits élevés, pour que les
-- enchères scellées individuelles restent masquées, tout en appliquant DANS
-- la fonction : le contrôle d'accès (admin-plateforme OU brand admin de la
-- maison) ET le gating de révélation (montants/clearing seulement si revealed).

create or replace function public.get_maison_drop_metrics(p_brand uuid default null)
returns table (
  drop_id uuid, brand_id uuid, drop_number int, title text, status text,
  exemplaires int, floor_price_cents bigint, clearing_price_cents bigint,
  bid_window_opens_at timestamptz, bid_lock_at timestamptz, reveal_at timestamptz,
  bid_count bigint, bidders bigint, qualified_bids bigint, watchers bigint,
  units_sold bigint, gross_cents bigint, payout_cents bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (
    public.is_platform_admin()
    or exists (select 1 from public.brand_admins ba
               where ba.user_id = auth.uid() and (p_brand is null or ba.brand_id = p_brand))
  ) then
    raise exception 'not authorized to read maison metrics';
  end if;

  return query
  select
    d.id, d.brand_id, d.drop_number, d.title, d.status, d.exemplaires, d.floor_price_cents,
    case when d.status = 'revealed' then d.clearing_price_cents end,
    d.bid_window_opens_at, d.bid_lock_at, d.reveal_at,
    (select count(*) from bids b where b.drop_id = d.id and b.status in ('active','won','lost')),
    (select count(distinct b.user_id) from bids b where b.drop_id = d.id),
    (select count(*) from bids b where b.drop_id = d.id and b.amount_cents >= d.floor_price_cents),
    (select count(*) from drop_follows f where f.drop_id = d.id)
      + (select count(*) from drop_alerts a where a.drop_id = d.id and a.status <> 'unsubscribed'),
    case when d.status = 'revealed' then (select count(*) from bids b where b.drop_id = d.id and b.status = 'won') end,
    case when d.status = 'revealed' then (select coalesce(sum(t.amount_paid_cents),0) from transactions t where t.drop_id = d.id and t.status = 'captured') end,
    case when d.status = 'revealed' then (select coalesce(sum(t.brand_payout_cents),0) from transactions t where t.drop_id = d.id and t.status = 'captured') end
  from drops d
  where (p_brand is not null and d.brand_id = p_brand)
     or (p_brand is null and (
           public.is_platform_admin()
           or d.brand_id in (select ba.brand_id from public.brand_admins ba where ba.user_id = auth.uid())))
  order by d.drop_number desc;
end;
$$;

revoke all on function public.get_maison_drop_metrics(uuid) from public, anon;
grant execute on function public.get_maison_drop_metrics(uuid) to authenticated;
