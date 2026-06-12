-- =====================================================================
-- 0026 — Privilège № 001
-- =====================================================================
-- Offre privée post-reveal : le bid gagnant le plus haut peut réserver
-- le numéro de série 001 contre un supplément.
--   supplément = 50% du spread (bid - clearing), plancher 5% du clearing,
--   plafond = spread (le total payé ne dépasse jamais le bid).
-- Pas d'offre si spread nul ou ex aequo en tête. Validité 24h.
-- Paiement : nouvelle PaymentIntent on-session (la pré-auth du bid a déjà
-- été consommée par la capture au clearing — une PI = une seule capture).
-- Discrétion : visible uniquement par le destinataire et /admin.
-- Voir Privilege_001.md.
-- =====================================================================

-- ------- transactions.serial_no -------
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS serial_no INTEGER
  CHECK (serial_no IS NULL OR serial_no > 0);

CREATE UNIQUE INDEX IF NOT EXISTS ux_transactions_drop_serial
  ON public.transactions (drop_id, serial_no)
  WHERE serial_no IS NOT NULL;

-- ------- serial_offers -------
CREATE TABLE public.serial_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID UNIQUE NOT NULL REFERENCES public.drops(id),
  bid_id UUID UNIQUE NOT NULL REFERENCES public.bids(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  transaction_id UUID UNIQUE NOT NULL REFERENCES public.transactions(id),
  serial_no INTEGER NOT NULL DEFAULT 1,
  supplement_cents BIGINT NOT NULL CHECK (supplement_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'refunded')),
  stripe_payment_intent_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

COMMENT ON TABLE public.serial_offers IS
  'Privilège № 001 : offre privée au top bidder. Jamais visible des maisons ni des autres gagnants.';

CREATE TRIGGER trg_serial_offers_updated BEFORE UPDATE ON public.serial_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_serial_offers_pending ON public.serial_offers (expires_at)
  WHERE status = 'pending';

ALTER TABLE public.serial_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_offers FORCE ROW LEVEL SECURITY;

-- Destinataire : lecture seule de sa propre offre.
CREATE POLICY serial_offers_select_own ON public.serial_offers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin plateforme : lecture seule (les mutations passent par les fonctions).
-- Pas de policy maison : discrétion du privilège.
CREATE POLICY serial_offers_platform_admin_select ON public.serial_offers
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- Aucune policy INSERT/UPDATE/DELETE : mutations via service role
-- et fonctions SECURITY DEFINER uniquement.

-- =====================================================================
-- create_serial_offer(p_drop_id)
-- Appelée par l'edge function close-drop (v3) après les captures.
-- Idempotente (UNIQUE drop_id). Service role uniquement.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.create_serial_offer(p_drop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_drop public.drops%ROWTYPE;
  v_top public.bids%ROWTYPE;
  v_tx public.transactions%ROWTYPE;
  v_tie_count INTEGER;
  v_spread BIGINT;
  v_supplement BIGINT;
  v_offer_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_drop FROM public.drops WHERE id = p_drop_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drop % introuvable', p_drop_id;
  END IF;

  IF v_drop.status <> 'revealed' OR v_drop.clearing_price_cents IS NULL THEN
    RETURN jsonb_build_object('created', false, 'reason', 'not_revealed');
  END IF;

  -- Idempotence : une seule offre par drop, quel que soit son statut.
  IF EXISTS (SELECT 1 FROM public.serial_offers WHERE drop_id = p_drop_id) THEN
    RETURN jsonb_build_object('created', false, 'reason', 'already_exists');
  END IF;

  -- Top bid gagnant (même tri que close_drop : montant desc, antériorité asc).
  SELECT * INTO v_top
  FROM public.bids
  WHERE drop_id = p_drop_id AND status = 'won'
  ORDER BY amount_cents DESC, submitted_at ASC
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('created', false, 'reason', 'no_winner');
  END IF;

  -- Ex aequo en tête : pas d'offre (personne n'est "le" plus haut).
  SELECT count(*) INTO v_tie_count
  FROM public.bids
  WHERE drop_id = p_drop_id AND status = 'won' AND amount_cents = v_top.amount_cents;
  IF v_tie_count > 1 THEN
    RETURN jsonb_build_object('created', false, 'reason', 'tie_at_top');
  END IF;

  -- Spread nul : pas d'offre.
  v_spread := v_top.amount_cents - v_drop.clearing_price_cents;
  IF v_spread <= 0 THEN
    RETURN jsonb_build_object('created', false, 'reason', 'no_spread');
  END IF;

  -- La capture du gagnant doit avoir réussi (l'offre s'ajoute à un achat réel).
  IF v_top.stripe_auth_status <> 'captured' THEN
    RETURN jsonb_build_object('created', false, 'reason', 'top_bid_not_captured');
  END IF;

  SELECT * INTO v_tx FROM public.transactions WHERE bid_id = v_top.id;
  IF NOT FOUND OR v_tx.status <> 'captured' THEN
    RETURN jsonb_build_object('created', false, 'reason', 'transaction_not_captured');
  END IF;

  -- supplément = 50% du spread, plancher 5% du clearing, plafond = spread.
  v_supplement := LEAST(
    GREATEST(v_spread / 2, (v_drop.clearing_price_cents * 5) / 100),
    v_spread
  );
  v_expires_at := now() + INTERVAL '24 hours';

  INSERT INTO public.serial_offers
    (drop_id, bid_id, user_id, transaction_id, supplement_cents, expires_at)
  VALUES
    (p_drop_id, v_top.id, v_top.user_id, v_tx.id, v_supplement, v_expires_at)
  RETURNING id INTO v_offer_id;

  RETURN jsonb_build_object(
    'created', true,
    'offer_id', v_offer_id,
    'user_id', v_top.user_id,
    'supplement_cents', v_supplement,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_serial_offer(UUID) FROM anon, authenticated, PUBLIC;

-- =====================================================================
-- accept_serial_offer(p_offer_id, p_payment_intent_id)
-- Appelée par le webhook Stripe (service role) après paiement réussi
-- du supplément. Attribue le serial 001 à la transaction.
-- Tolère le statut 'expired' : si le paiement a gagné la course contre
-- le cron d'expiration, on honore le paiement.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.accept_serial_offer(
  p_offer_id UUID,
  p_payment_intent_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.serial_offers%ROWTYPE;
BEGIN
  SELECT * INTO v_offer FROM public.serial_offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offre % introuvable', p_offer_id;
  END IF;

  -- Idempotence webhook.
  IF v_offer.status = 'accepted' THEN
    RETURN jsonb_build_object('ok', true, 'already_accepted', true);
  END IF;

  IF v_offer.status NOT IN ('pending', 'expired') THEN
    RAISE EXCEPTION 'Offre % non acceptable (statut %)', p_offer_id, v_offer.status;
  END IF;

  UPDATE public.serial_offers
  SET status = 'accepted',
      stripe_payment_intent_id = p_payment_intent_id,
      resolved_at = now()
  WHERE id = p_offer_id;

  UPDATE public.transactions
  SET serial_no = v_offer.serial_no
  WHERE id = v_offer.transaction_id;

  RETURN jsonb_build_object('ok', true, 'serial_no', v_offer.serial_no);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_serial_offer(UUID, TEXT) FROM anon, authenticated, PUBLIC;

-- =====================================================================
-- decline_serial_offer(p_offer_id)
-- Appelée par le destinataire lui-même (bouton "Conserver mon numéro").
-- =====================================================================
CREATE OR REPLACE FUNCTION public.decline_serial_offer(p_offer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.serial_offers
  SET status = 'declined', resolved_at = now()
  WHERE id = p_offer_id
    AND user_id = auth.uid()
    AND status = 'pending';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_pending_or_not_yours');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.decline_serial_offer(UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.decline_serial_offer(UUID) TO authenticated;

-- =====================================================================
-- admin_expire_serial_offer(p_offer_id)
-- Expiration manuelle par un admin plateforme (ex : top bidder banni).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_expire_serial_offer(p_offer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Réservé aux admins plateforme';
  END IF;

  UPDATE public.serial_offers
  SET status = 'expired', resolved_at = now()
  WHERE id = p_offer_id AND status = 'pending';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN jsonb_build_object('ok', v_updated = 1);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_expire_serial_offer(UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_expire_serial_offer(UUID) TO authenticated;

-- =====================================================================
-- expire_serial_offers() + cron
-- Expiration silencieuse des offres pending échues. Pas de notification.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.expire_serial_offers()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired INTEGER;
BEGIN
  UPDATE public.serial_offers
  SET status = 'expired', resolved_at = now()
  WHERE status = 'pending' AND expires_at < now();
  GET DIAGNOSTICS v_expired = ROW_COUNT;

  RETURN jsonb_build_object('expired', v_expired);
END;
$$;

REVOKE ALL ON FUNCTION public.expire_serial_offers() FROM anon, authenticated, PUBLIC;

SELECT cron.schedule(
  'expire_serial_offers_every_10_min',
  '*/10 * * * *',
  $cron$SELECT public.expire_serial_offers();$cron$
);
