-- 0030_demo_drops.sql
--
-- Démos prospects : un drop fictif par maison prospect, montré en call via une
-- URL gated (/demo/<slug>?key=...), jamais visible dans la vitrine publique ni
-- traité par les crons.
--
-- Cette migration est IDEMPOTENTE : les colonnes is_demo et les gardes de cron
-- ont été appliqués manuellement en prod le 2026-06-12 (le fichier d'origine
-- avait été perdu). On la rejoue pour que le repo soit reproductible de zéro.
--
-- Isolation des démos :
--   1. colonne is_demo sur brands + drops (défaut false) ;
--   2. la vue drops_public EXPOSE is_demo (les listings filtrent is_demo = false
--      côté requête ; la fiche drop /drop/[id] doit, elle, pouvoir lire la démo,
--      donc la vue ne filtre PAS les démos) ;
--   3. les crons (ouverture, clôture, rappels) excluent is_demo = true.

begin;

-- ── 1. Colonnes is_demo ──────────────────────────────────────────────────────
alter table public.brands add column if not exists is_demo boolean not null default false;
alter table public.drops  add column if not exists is_demo boolean not null default false;

-- ── 2. Vue publique : expose is_demo (ne filtre pas les démos) ────────────────
create or replace view public.drops_public as
  select
    id,
    drop_number,
    brand_id,
    title,
    piece_reference,
    description,
    floor_price_cents,
    exemplaires,
    bid_window_opens_at,
    reveal_at,
    bid_lock_at,
    status,
    case when status = 'revealed' then clearing_price_cents else null::bigint end as clearing_price_cents,
    bid_count,
    hero_image_url,
    images_urls,
    specs,
    revealed_at,
    format,
    is_demo
  from public.drops
  where status = any (array['scheduled','open','closed','revealed']);

-- ── 3. Crons : ne jamais ouvrir / clôturer / relancer une démo ───────────────

create or replace function public.open_ripe_drops()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_count integer;
begin
  with opened as (
    update public.drops
    set status = 'open'
    where status = 'scheduled'
      and bid_window_opens_at <= now()
      and reveal_at > now()
      and is_demo = false
    returning id
  )
  select count(*) into v_count from opened;
  return jsonb_build_object('opened', v_count, 'at', now());
end;
$function$;

create or replace function public.dispatch_ripe_drops()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_drop_id uuid;
  v_count integer := 0;
  v_edge_url text;
  v_service_key text;
begin
  select decrypted_secret into v_edge_url
    from vault.decrypted_secrets where name = 'edge_function_url';
  select decrypted_secret into v_service_key
    from vault.decrypted_secrets where name = 'service_role_key';

  if v_edge_url is null or v_service_key is null then
    raise exception 'Secrets Vault edge_function_url / service_role_key manquants. Voir supabase/README.md.';
  end if;

  for v_drop_id in
    select id from public.drops
    where status in ('open', 'closed')
      and reveal_at <= now()
      and clearing_price_cents is null  -- pas encore traité
      and is_demo = false               -- jamais de clôture sur une démo
    order by reveal_at asc
    limit 10
  loop
    perform net.http_post(
      url := v_edge_url || '/functions/v1/close-drop',
      body := jsonb_build_object('drop_id', v_drop_id),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_service_key,
        'Content-Type', 'application/json'
      ),
      timeout_milliseconds := 30000
    );
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('dispatched', v_count, 'at', now());
end;
$function$;

create or replace function public.reminders_due()
 returns table(drop_id uuid, kind text, drop_number integer, title text)
 language sql
 security definer
 set search_path to 'public'
as $function$
  select d.id, k.kind, d.drop_number, d.title
  from public.drops d
  cross join lateral (values
    ('open', d.bid_window_opens_at),
    ('h72', case when d.format = 'exceptionnel' then d.reveal_at - interval '72 hours' end),
    ('h24', d.reveal_at - interval '24 hours'),
    ('h1', d.reveal_at - interval '1 hour')
  ) as k(kind, trigger_at)
  where d.status = 'open'
    and d.is_demo = false
    and k.trigger_at is not null
    and now() >= k.trigger_at
    and now() < d.reveal_at
    and not exists (
      select 1 from public.drop_notifications n
      where n.drop_id = d.id and n.kind = k.kind
    );
$function$;

commit;
