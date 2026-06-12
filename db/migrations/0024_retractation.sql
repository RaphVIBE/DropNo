-- 0024_retractation.sql
-- Rétractation 14j EU + remboursements Stripe depuis l'admin.
--
--   1. withdrawal_requests — workflow par commande :
--      requested → return_in_transit → received → refunded | rejected.
--      Décision verrouillée : remboursement intégral, pas de restocking fee.
--      Créée par l'admin (le portail client viendra plus tard — prévoir
--      alors une policy INSERT client sur ses propres transactions).
--   2. refund_runs — journal append-only des tentatives de refund Stripe,
--      écrit par l'edge function refund-transaction (même pattern que
--      drop_close_runs).

-- ------- withdrawal_requests -------
create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid unique not null references public.transactions(id),
  status text not null default 'requested'
    check (status in ('requested', 'return_in_transit', 'received', 'refunded', 'rejected')),
  reason text,                 -- motif / contexte de la demande
  rejection_reason text,       -- requis au refus
  requested_at timestamptz not null default now(),
  refunded_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.withdrawal_requests is
  'Rétractations 14j EU (une par commande). Workflow opéré depuis /admin/commandes/[id] ; le refund Stripe passe par l''edge function refund-transaction.';

create trigger trg_withdrawal_requests_updated before update on public.withdrawal_requests
  for each row execute function public.set_updated_at();

alter table public.withdrawal_requests enable row level security;

create policy withdrawal_requests_platform_admin_manage on public.withdrawal_requests
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Le client voit la rétractation de ses propres commandes (lecture seule).
create policy withdrawal_requests_select_own on public.withdrawal_requests
  for select to authenticated
  using (exists (
    select 1 from public.transactions t
    where t.id = withdrawal_requests.transaction_id and t.user_id = auth.uid()
  ));

-- ------- refund_runs -------
create table public.refund_runs (
  id bigserial primary key,
  transaction_id uuid not null references public.transactions(id),
  ok boolean not null default false,
  stripe_refund_id text,
  amount_cents bigint,
  triggered_by text not null default 'admin' check (triggered_by in ('admin', 'system')),
  report jsonb not null default '{}'::jsonb,   -- détail / message d'erreur
  created_at timestamptz not null default now()
);
comment on table public.refund_runs is
  'Tentatives de remboursement Stripe. INSERT via service role (edge function refund-transaction), SELECT admin.';

create index idx_refund_runs_tx on public.refund_runs(transaction_id, created_at desc);

alter table public.refund_runs enable row level security;

create policy refund_runs_platform_admin_select on public.refund_runs
  for select to authenticated using (public.is_platform_admin());
