-- 0036_harden_dispatch_avant_premiere.sql
--
-- Durcissement (constaté 2026-06-19 via advisors) : la fonction
-- `dispatch_avant_premiere` était SECURITY DEFINER et exécutable par
-- `anon` ET `authenticated` (exposée en /rest/v1/rpc/...). Un visiteur pouvait
-- donc déclencher le push email d'avant-première à la Liste. Les autres
-- aiguilleurs cron (`dispatch_reminders`, `dispatch_ripe_drops`) sont déjà
-- verrouillés à postgres/cron ; on aligne celui-ci.
--
-- Revoke signature-safe (couvre toute surcharge éventuelle).
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig
           from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'dispatch_avant_premiere'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;
