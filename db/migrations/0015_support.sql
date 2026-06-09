-- 0015_support.sql
-- Support : tickets + fil de messages (avec notes internes réservées au staff).
-- RLS : admin-plateforme tout ; client = ses propres tickets/messages non
-- internes (pour un futur portail client). Trigger : remonte last_activity_at.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  subject text not null check (char_length(subject) between 3 and 120),
  category text not null default 'other' check (category in ('order','delivery','kyc','payment','bid','other')),
  status text not null default 'open' check (status in ('open','pending','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  related_transaction_id uuid references public.transactions(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_kind text not null check (author_kind in ('client','staff')),
  body text not null check (char_length(body) between 1 and 5000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_ticket_idx on public.support_messages(ticket_id, created_at);
create index if not exists support_tickets_status_idx on public.support_tickets(status, last_activity_at desc);

-- Remonte le ticket parent à chaque message.
create or replace function public.touch_support_ticket()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.support_tickets set last_activity_at = now(), updated_at = now() where id = NEW.ticket_id;
  return NEW;
end $$;
-- Fonction-trigger : ne doit pas être appelable directement via l'API REST.
revoke all on function public.touch_support_ticket() from public, anon, authenticated;

drop trigger if exists trg_touch_support_ticket on public.support_messages;
create trigger trg_touch_support_ticket
  after insert on public.support_messages
  for each row execute function public.touch_support_ticket();

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

create policy "tickets_admin_all" on public.support_tickets
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "messages_admin_all" on public.support_messages
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "tickets_select_own" on public.support_tickets
  for select to authenticated using (user_id = auth.uid());
create policy "tickets_insert_own" on public.support_tickets
  for insert to authenticated with check (user_id = auth.uid());

create policy "messages_select_own" on public.support_messages
  for select to authenticated using (
    not is_internal and exists (
      select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()
    )
  );
create policy "messages_insert_own" on public.support_messages
  for insert to authenticated with check (
    not is_internal and author_kind = 'client' and author_id = auth.uid()
    and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );
