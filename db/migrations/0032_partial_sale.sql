-- =====================================================================
-- 0032_partial_sale.sql
-- Vente partielle par défaut + option « tout ou rien » par drop.
--
-- Décision owner (2026-06-16) : si toutes les pièces ne trouvent pas
-- preneur (offres qualifiées K < N exemplaires), on VEND les K exemplaires
-- au prix de la plus basse offre gagnante (clearing = K-ième bid). Les
-- exemplaires sans preneur restent à la maison. La maison qui préfère le
-- tout ou rien coche `all_or_nothing` à la création : en deçà de N, le drop
-- est alors annulé et toutes les pré-autorisations libérées.
--
-- Rappel : close_drop() vendait déjà partiellement (elle n'annulait qu'à
-- zéro offre ≥ plancher). Cette migration ajoute le flag, le branchement
-- « tout ou rien » et enrichit le retour JSON (winners_count, partial).
-- =====================================================================

-- 1. Flag par drop. Défaut false = vente partielle autorisée.
ALTER TABLE public.drops
  ADD COLUMN IF NOT EXISTS all_or_nothing BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.drops.all_or_nothing IS
  'true = annule le drop si offres qualifiées < exemplaires (tout ou rien). false (défaut) = vente partielle au prix de la plus basse offre gagnante.';

-- 2. close_drop() v4 : respecte all_or_nothing.
CREATE OR REPLACE FUNCTION public.close_drop(p_drop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_drop public.drops%ROWTYPE;
  v_clearing_price BIGINT;
  v_winners_count INTEGER;
  v_platform_fee_pct NUMERIC := 0.12;
  v_platform_fee_fixed_cents BIGINT := 500;
BEGIN
  -- Lock drop
  SELECT * INTO v_drop FROM public.drops WHERE id = p_drop_id FOR UPDATE;

  IF v_drop IS NULL THEN
    RAISE EXCEPTION 'Drop % introuvable', p_drop_id;
  END IF;

  IF v_drop.status = 'revealed' OR v_drop.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'status', v_drop.status,
      'clearing_price_cents', v_drop.clearing_price_cents,
      'already_processed', true
    );
  END IF;

  IF v_drop.status <> 'open' AND v_drop.status <> 'closed' THEN
    RAISE EXCEPTION 'Drop % statut inattendu : %', p_drop_id, v_drop.status;
  END IF;

  IF now() < v_drop.reveal_at THEN
    RAISE EXCEPTION 'Drop % pas encore arrivé à reveal_at', p_drop_id;
  END IF;

  -- Sélectionner les gagnants (top par amount DESC, tie-break submitted_at ASC,
  -- au plus N). clearing = la plus basse offre gagnante (K-ième si K < N).
  WITH ranked AS (
    SELECT id, user_id, amount_cents,
           ROW_NUMBER() OVER (ORDER BY amount_cents DESC, submitted_at ASC) AS rnk
    FROM public.bids
    WHERE drop_id = p_drop_id
      AND status = 'active'
      AND amount_cents >= v_drop.floor_price_cents
  ),
  winners AS (
    SELECT id, user_id, amount_cents
    FROM ranked
    WHERE rnk <= v_drop.exemplaires
  )
  SELECT MIN(amount_cents), COUNT(*)
    INTO v_clearing_price, v_winners_count
  FROM winners;

  v_winners_count := COALESCE(v_winners_count, 0);

  -- Cas annulation :
  --   (a) aucune offre au-dessus du plancher, ou
  --   (b) drop « tout ou rien » sous-souscrit (gagnants < exemplaires).
  IF v_winners_count = 0
     OR (v_drop.all_or_nothing AND v_winners_count < v_drop.exemplaires) THEN
    UPDATE public.drops
      SET status = 'cancelled', updated_at = now()
      WHERE id = p_drop_id;
    UPDATE public.bids
      SET status = 'invalid', updated_at = now()
      WHERE drop_id = p_drop_id AND status = 'active';
    RETURN jsonb_build_object(
      'status', 'cancelled',
      'reason', CASE
                  WHEN v_winners_count = 0 THEN 'insufficient_bids'
                  ELSE 'all_or_nothing_undersubscribed'
                END,
      'bids_above_floor', v_winners_count,
      'exemplaires', v_drop.exemplaires
    );
  END IF;

  -- Marquer les gagnants
  UPDATE public.bids b
    SET status = 'won', updated_at = now()
  FROM (
    SELECT id FROM public.bids
    WHERE drop_id = p_drop_id AND status = 'active' AND amount_cents >= v_drop.floor_price_cents
    ORDER BY amount_cents DESC, submitted_at ASC
    LIMIT v_drop.exemplaires
  ) w
  WHERE b.id = w.id;

  -- Marquer les perdants
  UPDATE public.bids
    SET status = 'lost', updated_at = now()
    WHERE drop_id = p_drop_id AND status = 'active';

  -- Créer les transactions pour les gagnants (au clearing price uniforme)
  INSERT INTO public.transactions (bid_id, drop_id, user_id, amount_paid_cents, platform_fee_cents, brand_payout_cents, withdrawal_window_ends_at)
  SELECT
    b.id,
    b.drop_id,
    b.user_id,
    v_clearing_price,
    (v_clearing_price * v_platform_fee_pct)::BIGINT + v_platform_fee_fixed_cents,
    v_clearing_price - ((v_clearing_price * v_platform_fee_pct)::BIGINT + v_platform_fee_fixed_cents),
    now() + INTERVAL '14 days'
  FROM public.bids b
  WHERE b.drop_id = p_drop_id AND b.status = 'won';

  -- Update drop
  UPDATE public.drops
    SET status = 'revealed',
        clearing_price_cents = v_clearing_price,
        revealed_at = now(),
        updated_at = now()
    WHERE id = p_drop_id;

  RETURN jsonb_build_object(
    'status', 'revealed',
    'clearing_price_cents', v_clearing_price,
    'winners_count', v_winners_count,
    'exemplaires', v_drop.exemplaires,
    'partial', v_winners_count < v_drop.exemplaires,
    'revealed_at', now()
  );
END;
$$;

-- Hardening cohérent avec 0001/0002 : service role uniquement.
REVOKE ALL ON FUNCTION public.close_drop(UUID) FROM anon, authenticated, PUBLIC;
