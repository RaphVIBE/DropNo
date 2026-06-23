-- 0035_revoke_drops_public_writes.sql
--
-- FAILLE CRITIQUE corrigée (constatée 2026-06-18).
--
-- La vue `drops_public` est exposée à la vitrine (lecture des drops publics).
-- Par défaut Supabase accorde ALL au rôle `anon`/`authenticated` sur les objets
-- du schéma `public`. Sur une TABLE, la RLS protège ; mais `drops_public` est une
-- vue `security_invoker = false` (elle s'exécute en tant que `postgres`) au-dessus
-- de `drops`, et `drops` n'a pas FORCE RLS. Comme la vue est auto-updatable,
-- un visiteur ANONYME (clé publique embarquée dans le navigateur) pouvait
-- `PATCH/POST/DELETE /drops_public` via PostgREST et écrire dans `drops` en
-- CONTOURNANT la RLS : modifier le plancher, le statut, les exemplaires ou la
-- date de reveal d'un drop en cours, ou insérer/supprimer des drops.
--
-- Correctif : ne laisser que SELECT. L'application ne fait que LIRE la vue ;
-- toute écriture passe par la table `drops` en session admin (RLS is_platform_admin).
revoke insert, update, delete, truncate, references, trigger
  on public.drops_public from anon, authenticated;

-- Garantie : SELECT conservé pour la vitrine publique.
grant select on public.drops_public to anon, authenticated;
