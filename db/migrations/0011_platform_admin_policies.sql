-- 0011_platform_admin_policies.sql
-- Accès back-office aux données métier. Policies PERMISSIVE combinées en OR
-- avec les policies existantes (brand_admins, propres lignes) : aucun accès
-- existant n'est retiré. L'admin-plateforme peut tout gérer/voir.

-- Curation
drop policy if exists "drops_platform_admin_manage" on public.drops;
create policy "drops_platform_admin_manage" on public.drops
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists "brands_platform_admin_manage" on public.brands;
create policy "brands_platform_admin_manage" on public.brands
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists "brand_admins_platform_manage" on public.brand_admins;
create policy "brand_admins_platform_manage" on public.brand_admins
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Commandes & fulfillment
drop policy if exists "transactions_platform_admin_manage" on public.transactions;
create policy "transactions_platform_admin_manage" on public.transactions
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists "deliveries_platform_admin_manage" on public.deliveries;
create policy "deliveries_platform_admin_manage" on public.deliveries
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Lecture clients & enchères (support / visibilité)
drop policy if exists "profiles_platform_admin_select" on public.profiles;
create policy "profiles_platform_admin_select" on public.profiles
  for select to authenticated using (public.is_platform_admin());

drop policy if exists "bids_platform_admin_select" on public.bids;
create policy "bids_platform_admin_select" on public.bids
  for select to authenticated using (public.is_platform_admin());
