-- 0038_drops_localized_content.sql
--
-- Contenu de drop localisé (FR par défaut, EN optionnel).
--
-- Problème : `drops.description` et `drops.specs` sont mono-langue. La vitrine
-- rend ce texte brut quelle que soit la locale, donc une pièce rédigée en FR
-- s'affiche en français sur /en (clés de specs « Boîtier », « Mouvement »
-- comprises). Constaté sur le drop démo « Plongeur Bronze » côté EN.
--
-- Correctif : colonnes `description_en` (texte) et `specs_en` (objet JSON clé
-- EN -> valeur EN). L'app choisit la variante EN quand locale = en ET qu'elle
-- existe, sinon retombe sur le FR de base. Rétro-compatible : colonnes nullable,
-- les drops sans EN s'affichent comme avant.

alter table public.drops
  add column if not exists description_en text,
  add column if not exists specs_en jsonb;

-- Recréation de la vue publique pour exposer les colonnes EN.
--
-- ⚠️ SÉCURITÉ : `drops_public` DOIT rester SECURITY DEFINER (security_invoker
-- = false). En security_invoker, la RLS de `drops` rouvrirait la lecture et
-- ferait fuiter le clearing price avant reveal. Le masque CASE WHEN status =
-- 'revealed' est conservé tel quel. On ajoute seulement deux colonnes de
-- contenu public (description_en, specs_en) — aucune donnée sensible.
-- Note : CREATE OR REPLACE VIEW n'autorise que l'AJOUT de colonnes en fin de
-- liste (pas d'insertion au milieu). description_en / specs_en sont donc
-- appendues après is_demo, l'ordre existant est conservé à l'identique.
create or replace view public.drops_public with (security_invoker = false) as
select id, drop_number, brand_id, title, piece_reference, description,
  floor_price_cents, exemplaires, bid_window_opens_at, reveal_at, bid_lock_at, status,
  case when status = 'revealed' then clearing_price_cents else null::bigint end as clearing_price_cents,
  bid_count, hero_image_url, images_urls, specs, revealed_at, format, is_demo,
  description_en, specs_en
from public.drops
where status = any (array['scheduled','open','closed','revealed']);

-- La vue est auto-updatable et DEFINER : ne laisser que SELECT à anon/auth
-- (rappel du correctif 0035, ré-asserté par prudence après recréation).
revoke insert, update, delete, truncate, references, trigger
  on public.drops_public from anon, authenticated;
grant select on public.drops_public to anon, authenticated;
