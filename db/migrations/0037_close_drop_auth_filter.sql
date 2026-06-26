-- =====================================================================
-- 0037_close_drop_auth_filter.sql
-- close_drop() v5 : ne retiennent comme gagnantes que les offres dont la
-- carte est réellement pré-autorisée (stripe_auth_status = 'authorized').
--
-- Problème corrigé (BUILD_PLAN P1.2b, Ligne de tir L2) :
--   close_drop v4 (0032) sélectionnait les gagnants sur le seul couple
--   (status = 'active', amount_cents >= plancher). Or une offre peut rester
--   'active' alors que sa pré-autorisation Stripe n'a jamais abouti
--   (stripe_auth_status = 'pending', ou 'failed'/'released'). Une telle
--   offre pouvait « gagner » au reveal alors que la capture est impossible
--   au moment du paiement : exemplaire bloqué, clearing faussé.
--
-- Correctif : on ajoute « AND stripe_auth_status = 'authorized' » partout où
-- l'on choisit les gagnants (ranking, marquage 'won', clearing). Les offres
-- 'active' mais non autorisées sont écartées de la sélection ; elles sont
-- traitées comme les autres non-retenues (passées à 'lost' / 'invalid').
--
-- Conséquence sur le clearing (uniform price N-ième) : le classement ne
-- porte plus que sur les offres réellement payables. Le clearing reste la
-- plus basse offre GAGNANTE, c.-à-d. la K-ième offre autorisée (K = nombre
-- d'offres autorisées >= plancher, plafonné à N). C'est le comportement
-- voulu : on ne fait jamais payer un clearing fixé par une offre qui
-- n'aurait pas pu être capturée. La logique vente partielle /
-- all_or_nothing est inchangée, elle s'applique désormais au compte des
-- offres autorisées.
--
-- Note : on filtre sur 'authorized' (et non 'captured') par construction.
-- Au moment du reveal, aucune offre du drop n'est encore 'captured' : la
-- capture Stripe n'a lieu QU'APRES close_drop (côté edge function close-drop,
-- sur les offres passées à 'won'). 'captured' est donc hors-sélection ici, et
-- l'inclure ne changerait rien (l'ensemble est vide à cet instant).
--
-- Tout le reste de la fonction est repris à l'identique de 0032 (lock,
-- gardes de statut, annulation, transactions, drop_close_runs côté edge
-- function, Privilège 001 via create_serial_offer qui exige déjà
-- stripe_auth_status = 'captured').
-- =====================================================================

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
  -- au plus N). On ne retient QUE les offres dont la carte est pré-autorisée :
  -- stripe_auth_status = 'authorized'. Les offres 'active' mais non autorisées
  -- (pending/failed/released) sont écartées car non capturables.
  -- clearing = la plus basse offre gagnante (K-ième si K < N).
  WITH ranked AS (
    SELECT id, user_id, amount_cents,
           ROW_NUMBER() OVER (ORDER BY amount_cents DESC, submitted_at ASC) AS rnk
    FROM public.bids
    WHERE drop_id = p_drop_id
      AND status = 'active'
      AND stripe_auth_status = 'authorized'
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
  --   (a) aucune offre autorisée au-dessus du plancher, ou
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

  -- Marquer les gagnants (mêmes filtres que le ranking ci-dessus)
  UPDATE public.bids b
    SET status = 'won', updated_at = now()
  FROM (
    SELECT id FROM public.bids
    WHERE drop_id = p_drop_id
      AND status = 'active'
      AND stripe_auth_status = 'authorized'
      AND amount_cents >= v_drop.floor_price_cents
    ORDER BY amount_cents DESC, submitted_at ASC
    LIMIT v_drop.exemplaires
  ) w
  WHERE b.id = w.id;

  -- Marquer les perdants : toute offre encore 'active' non promue 'won'
  -- (y compris les 'active' non autorisées écartées de la sélection).
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

-- Hardening cohérent avec 0001/0002/0032 : service role uniquement.
REVOKE ALL ON FUNCTION public.close_drop(UUID) FROM anon, authenticated, PUBLIC;
