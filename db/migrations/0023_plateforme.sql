-- 0023_plateforme.sql
-- Page /admin/plateforme :
--   1. Gestion des admins depuis l'UI — jusqu'ici INSERT/DELETE en SQL à la
--      main. Seuls les admins de rôle 'owner' gèrent l'équipe ; trigger
--      anti-lockout : impossible de supprimer/déclasser le dernier owner.
--   2. get_bid_audit() — lecture admin du bid_audit_log (append-only,
--      jusqu'ici service role only), avec montants MASQUÉS tant que le drop
--      n'est pas révélé/annulé (hygiène sealed-bid, même pour l'opérateur).

-- ------- helper : owner ? -------
create or replace function public.is_platform_owner(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.user_id = uid and pa.role = 'owner'
  );
$$;

revoke all on function public.is_platform_owner(uuid) from public, anon;
grant execute on function public.is_platform_owner(uuid) to authenticated;

-- ------- écriture platform_admins : owners only -------
drop policy if exists "platform_admins_owner_manage" on public.platform_admins;
create policy "platform_admins_owner_manage" on public.platform_admins
  for all to authenticated
  using (public.is_platform_owner()) with check (public.is_platform_owner());

-- ------- anti-lockout : toujours au moins un owner -------
create or replace function public.protect_last_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'owner'
     and (tg_op = 'DELETE' or new.role <> 'owner')
     and (select count(*) from public.platform_admins where role = 'owner') <= 1 then
    raise exception 'Impossible de retirer le dernier owner de la plateforme.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_last_owner on public.platform_admins;
create trigger trg_protect_last_owner
  before delete or update on public.platform_admins
  for each row execute function public.protect_last_owner();

-- Les fonctions trigger héritent d'EXECUTE public → ne pas l'exposer en RPC.
revoke all on function public.protect_last_owner() from public, anon, authenticated;

-- ------- journal des enchères (admin, montants gated au reveal) -------
create or replace function public.get_bid_audit(
  p_drop uuid default null,
  p_action text default null,
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (
  id bigint,
  occurred_at timestamptz,
  action text,
  drop_id uuid,
  drop_number integer,
  drop_title text,
  drop_status text,
  user_email text,
  amount_cents bigint,   -- null tant que le drop n'est pas revealed/cancelled
  bid_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Accès refusé : admin-plateforme uniquement';
  end if;

  return query
  select
    l.id,
    l.occurred_at,
    l.action,
    l.drop_id,
    d.drop_number,
    d.title,
    d.status,
    p.email,
    case when d.status in ('revealed', 'cancelled') then l.amount_cents_at_time end,
    l.bid_id
  from public.bid_audit_log l
  join public.drops d on d.id = l.drop_id
  left join public.profiles p on p.id = l.user_id
  where (p_drop is null or l.drop_id = p_drop)
    and (p_action is null or l.action = p_action)
  order by l.occurred_at desc
  limit least(greatest(p_limit, 1), 200)
  offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.get_bid_audit(uuid, text, integer, integer) from public, anon;
grant execute on function public.get_bid_audit(uuid, text, integer, integer) to authenticated;
