-- 0021_close_console.sql
-- Console de clôture (/admin/cloture) :
--   1. drop_close_runs — rapports d'exécution de l'edge function close-drop,
--      jusqu'ici retournés au caller (cron) puis perdus. Écrits par l'edge
--      function v2 en service role, lus par l'admin-plateforme.
--   2. get_cron_health() — état des jobs pg_cron (dernier run, échecs 24h),
--      admin only. cron.* n'est pas lisible par authenticated, d'où le
--      SECURITY DEFINER avec contrôle d'accès interne (même pattern que
--      get_maison_drop_metrics / get_client_overview).

-- ------- drop_close_runs -------
create table public.drop_close_runs (
  id bigserial primary key,
  drop_id uuid not null references public.drops(id) on delete cascade,
  triggered_by text not null default 'cron' check (triggered_by in ('cron', 'admin')),
  ok boolean not null default false,            -- true = run sans aucune erreur capture/release
  close_status text,                            -- 'revealed' | 'cancelled' | null si échec SQL
  report jsonb not null default '{}'::jsonb,    -- ProcessReport complet (captures, releases, errors)
  created_at timestamptz not null default now()
);
comment on table public.drop_close_runs is
  'Rapports d''exécution de close-drop. INSERT via service role (edge function), SELECT admin-plateforme.';

create index idx_close_runs_drop on public.drop_close_runs(drop_id, created_at desc);

alter table public.drop_close_runs enable row level security;

-- Lecture : admin-plateforme uniquement. Pas de policy INSERT/UPDATE/DELETE :
-- seul le service role (bypass RLS) écrit, personne ne modifie.
create policy close_runs_platform_admin_select on public.drop_close_runs
  for select to authenticated using (public.is_platform_admin());

-- ------- get_cron_health -------
create or replace function public.get_cron_health()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_out jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Accès refusé : admin-plateforme uniquement';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'jobname', j.jobname,
      'schedule', j.schedule,
      'active', j.active,
      'last_run_at', d.start_time,
      'last_status', d.status,
      'last_message', left(coalesce(d.return_message, ''), 300),
      'failures_24h', coalesce(f.failures, 0)
    )
    order by j.jobid
  )
  into v_out
  from cron.job j
  left join lateral (
    select start_time, status, return_message
    from cron.job_run_details
    where jobid = j.jobid
    order by start_time desc
    limit 1
  ) d on true
  left join lateral (
    select count(*) as failures
    from cron.job_run_details
    where jobid = j.jobid
      and status = 'failed'
      and start_time > now() - interval '24 hours'
  ) f on true;

  return coalesce(v_out, '[]'::jsonb);
end;
$$;

revoke all on function public.get_cron_health() from public, anon;
grant execute on function public.get_cron_health() to authenticated;
