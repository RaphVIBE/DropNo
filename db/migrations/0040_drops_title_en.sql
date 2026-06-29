-- 0040_drops_title_en.sql
--
-- Titre de drop localisé (FR par défaut, EN optionnel).
--
-- Problème : `drops.title` est mono-langue. La fiche démo rend ce titre brut
-- quelle que soit la locale, donc un titre rédigé en FR s'affiche tel quel sur
-- /en (constaté sur la démo Ressence « Type 3 · Noir » qui restait identique
-- côté EN). Les colonnes `description_en` / `specs_en` (0038) traitaient déjà
-- le récit et les specs ; le titre était le frère manquant.
--
-- Correctif : colonne `title_en`. L'app choisit la variante EN quand
-- locale = en ET qu'elle existe, sinon retombe sur le FR de base. Rétro-
-- compatible : colonne nullable, les drops sans EN s'affichent comme avant.

alter table public.drops
  add column if not exists title_en text;

-- Recréation de la vue publique pour exposer la colonne EN.
--
-- ⚠️ SÉCURITÉ : `drops_public` DOIT rester SECURITY DEFINER (security_invoker
-- = false). En security_invoker, la RLS de `drops` rouvrirait la lecture et
-- ferait fuiter le clearing price avant reveal. Le masque CASE WHEN status =
-- 'revealed' est conservé tel quel. On ajoute seulement une colonne de contenu
-- public (title_en) — aucune donnée sensible.
-- Note : CREATE OR REPLACE VIEW n'autorise que l'AJOUT de colonnes en fin de
-- liste (pas d'insertion au milieu). title_en est donc appendue après specs_en,
-- l'ordre existant est conservé à l'identique.
create or replace view public.drops_public with (security_invoker = false) as
select id, drop_number, brand_id, title, piece_reference, description,
  floor_price_cents, exemplaires, bid_window_opens_at, reveal_at, bid_lock_at, status,
  case when status = 'revealed' then clearing_price_cents else null::bigint end as clearing_price_cents,
  bid_count, hero_image_url, images_urls, specs, revealed_at, format, is_demo,
  description_en, specs_en, title_en
from public.drops
where status = any (array['scheduled','open','closed','revealed']);

-- La vue est auto-updatable et DEFINER : ne laisser que SELECT à anon/auth
-- (rappel des correctifs 0035/0038, ré-asserté par prudence après recréation).
revoke insert, update, delete, truncate, references, trigger
  on public.drops_public from anon, authenticated;
grant select on public.drops_public to anon, authenticated;
