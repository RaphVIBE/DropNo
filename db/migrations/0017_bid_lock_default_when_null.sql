-- 0017 — Verrouillage par défaut seulement si non fourni.
--
-- Jusqu'ici le trigger écrasait systématiquement bid_lock_at avec reveal_at − 1h
-- (à l'INSERT et à chaque UPDATE OF reveal_at). L'admin pouvant désormais saisir
-- un verrouillage custom via « Paramètres avancés », on ne pose le défaut que
-- lorsque bid_lock_at est NULL — une valeur explicite est préservée.
--
-- Backward compatible : le comportement par défaut (NULL ⇒ reveal − 1h) est inchangé.

CREATE OR REPLACE FUNCTION public.set_drops_bid_lock_at() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bid_lock_at IS NULL THEN
    NEW.bid_lock_at := NEW.reveal_at - INTERVAL '1 hour';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conserve le durcissement de 0002 (search_path figé).
ALTER FUNCTION public.set_drops_bid_lock_at() SET search_path = public;
