-- 0018 — Format de drop (cadence + presets de timeline).
--
-- 'standard'     : drop hebdo, créneau fixe (jeudi 18:00), fenêtre de bids courte.
-- 'exceptionnel' : pièce rare hors-cadence, runway long, fenêtre étendue.
--
-- Le format ne porte aucune logique DB : il pilote les *presets* de dérivation
-- des dates côté app (ouverture/verrouillage/annonce dérivés du reveal) et sert
-- de dimension d'analyse une fois l'analytique branchée. Les dates restent la
-- source de vérité ; le format est un label.

ALTER TABLE public.drops
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'standard';

ALTER TABLE public.drops
  DROP CONSTRAINT IF EXISTS drops_format_check;
ALTER TABLE public.drops
  ADD CONSTRAINT drops_format_check CHECK (format IN ('standard', 'exceptionnel'));
