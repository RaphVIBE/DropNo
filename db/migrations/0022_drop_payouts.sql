-- 0022_drop_payouts.sql
-- Payouts maisons (/admin/finance).
--
-- Principe : pas de machine à états stockée — tout le « dû » se calcule en
-- live depuis transactions (captured − refunded, fenêtre de rétractation).
-- On ne stocke que l'événement irréversible : « ce drop a été payé à la
-- maison », avec un snapshot des montants au moment du virement. Si un
-- remboursement intervient après paiement, l'écart snapshot vs calcul live
-- est détecté côté UI.
--
-- 1 drop = 1 maison = au plus 1 payout (UNIQUE drop_id).

create table public.drop_payouts (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid unique not null references public.drops(id),
  -- Snapshot au moment du paiement (cents, comme partout)
  units integer not null,                -- exemplaires payés (tx captured)
  gross_cents bigint not null,           -- CA brut capturé
  fee_cents bigint not null,             -- commission plateforme (12% + 5€/pièce)
  net_cents bigint not null,             -- versé à la maison
  payment_reference text,                -- référence du virement
  note text,
  paid_at timestamptz not null default now(),
  paid_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
comment on table public.drop_payouts is
  'Journal des versements maisons. Une ligne = un virement effectué (snapshot des montants). Le dû se calcule en live depuis transactions.';

alter table public.drop_payouts enable row level security;

-- Admin-plateforme uniquement (création + correction d''une erreur de saisie).
create policy drop_payouts_platform_admin_manage on public.drop_payouts
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
