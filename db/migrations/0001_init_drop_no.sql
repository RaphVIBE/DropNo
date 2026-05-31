-- =====================================================================
-- Drop No. — migration initiale
-- =====================================================================
-- Modèle sealed-bid uniform price (N-ième bid clearing).
-- Tous les bids sont confidentiels jusqu'à la révélation.
-- Brand admins ne voient JAMAIS les bids individuels de leurs drops.
-- =====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- digest()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- TABLES
-- =====================================================================

-- ------- profiles -------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (kyc_status IN ('pending', 'verifying', 'verified', 'rejected')),
  kyc_stripe_session_id TEXT,
  kyc_verified_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  newsletter_subscribed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Extension de auth.users — KYC + Stripe customer + préférences.';

-- ------- brands -------
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  country_code TEXT,
  contract_signed_at TIMESTAMPTZ,
  kbis_verified BOOLEAN NOT NULL DEFAULT false,
  stripe_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'terminated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------- brand_admins -------
CREATE TABLE public.brand_admins (
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (brand_id, user_id)
);

-- ------- drops -------
CREATE TABLE public.drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_number INTEGER UNIQUE NOT NULL,         -- 001, 002, ...
  brand_id UUID NOT NULL REFERENCES public.brands(id),
  title TEXT NOT NULL,
  piece_reference TEXT,
  description TEXT,
  floor_price_cents BIGINT NOT NULL
    CHECK (floor_price_cents >= 300000),       -- 3000€ minimum MVP
  exemplaires INTEGER NOT NULL CHECK (exemplaires > 0 AND exemplaires <= 100),
  bid_window_opens_at TIMESTAMPTZ NOT NULL,
  reveal_at TIMESTAMPTZ NOT NULL,
  bid_lock_at TIMESTAMPTZ,  -- maintenu par trigger (timestamptz - interval n'est pas IMMUTABLE, donc pas de GENERATED)
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'open', 'closed', 'revealed', 'cancelled')),
  clearing_price_cents BIGINT,                  -- N-ième bid, rempli au reveal
  bid_count INTEGER NOT NULL DEFAULT 0,         -- compteur agrégé (public)
  hero_image_url TEXT,
  images_urls JSONB DEFAULT '[]'::jsonb,
  specs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_at TIMESTAMPTZ,
  CONSTRAINT valid_window CHECK (bid_window_opens_at < reveal_at),
  CONSTRAINT reveal_at_least_1h_window CHECK (reveal_at - bid_window_opens_at >= INTERVAL '1 hour')
);

-- ------- bids -------
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES public.drops(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  stripe_payment_intent_id TEXT,
  stripe_auth_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (stripe_auth_status IN ('pending', 'authorized', 'captured', 'failed', 'released')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'withdrawn', 'won', 'lost', 'invalid')),
  amount_hash TEXT,
  bid_locked BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  UNIQUE (drop_id, user_id)
);

-- ------- bid_audit_log -------
CREATE TABLE public.bid_audit_log (
  id BIGSERIAL PRIMARY KEY,
  bid_id UUID NOT NULL,
  drop_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'modify', 'withdraw', 'finalize_won', 'finalize_lost', 'invalidate')),
  amount_cents_at_time BIGINT,
  amount_hash TEXT NOT NULL,
  previous_hash TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.bid_audit_log IS 'Append-only. Hash chain pour détecter toute altération. Pas de RLS SELECT — service role only.';

-- ------- transactions -------
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES public.bids(id),
  drop_id UUID NOT NULL REFERENCES public.drops(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount_paid_cents BIGINT NOT NULL,
  platform_fee_cents BIGINT NOT NULL,
  brand_payout_cents BIGINT NOT NULL,
  stripe_charge_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'captured', 'refunded', 'failed')),
  withdrawal_window_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  captured_at TIMESTAMPTZ
);

-- ------- deliveries -------
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID UNIQUE NOT NULL REFERENCES public.transactions(id),
  carrier TEXT NOT NULL CHECK (carrier IN ('dhl', 'malca_amit', 'brinks')),
  tracking_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'preparing', 'shipped', 'in_transit', 'delivered', 'returned', 'lost')),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------- drop_follows -------
CREATE TABLE public.drop_follows (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  drop_id UUID NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, drop_id)
);

-- =====================================================================
-- INDEXES
-- =====================================================================
CREATE INDEX idx_drops_status ON public.drops(status);
CREATE INDEX idx_drops_reveal_at_open ON public.drops(reveal_at) WHERE status = 'open';
CREATE INDEX idx_drops_brand ON public.drops(brand_id);
CREATE INDEX idx_bids_drop ON public.bids(drop_id);
CREATE INDEX idx_bids_user ON public.bids(user_id);
CREATE INDEX idx_bids_drop_amount_active ON public.bids(drop_id, amount_cents DESC, submitted_at ASC)
  WHERE status = 'active';
CREATE INDEX idx_audit_drop ON public.bid_audit_log(drop_id);
CREATE INDEX idx_audit_bid ON public.bid_audit_log(bid_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_drop ON public.transactions(drop_id);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- updated_at auto
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_brands_updated BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_drops_updated BEFORE UPDATE ON public.drops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Maintien automatique de bid_lock_at = reveal_at - 1h
CREATE OR REPLACE FUNCTION public.set_drops_bid_lock_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.bid_lock_at := NEW.reveal_at - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_drops_bid_lock_at BEFORE INSERT OR UPDATE OF reveal_at ON public.drops
  FOR EACH ROW EXECUTE FUNCTION public.set_drops_bid_lock_at();
CREATE TRIGGER trg_bids_updated BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- audit log : append on insert/update
CREATE OR REPLACE FUNCTION public.log_bid_change() RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_prev_hash TEXT;
  v_new_hash TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_prev_hash := NULL;
  ELSIF NEW.status = 'withdrawn' AND OLD.status <> 'withdrawn' THEN
    v_action := 'withdraw';
  ELSIF NEW.status = 'won' THEN
    v_action := 'finalize_won';
  ELSIF NEW.status = 'lost' THEN
    v_action := 'finalize_lost';
  ELSIF NEW.status = 'invalid' THEN
    v_action := 'invalidate';
  ELSE
    v_action := 'modify';
  END IF;

  IF TG_OP <> 'INSERT' THEN
    v_prev_hash := encode(digest(OLD.id::text || OLD.amount_cents::text || OLD.updated_at::text, 'sha256'), 'hex');
  END IF;

  v_new_hash := encode(digest(NEW.id::text || NEW.amount_cents::text || NEW.updated_at::text || COALESCE(v_prev_hash, ''), 'sha256'), 'hex');

  INSERT INTO public.bid_audit_log (bid_id, drop_id, user_id, action, amount_cents_at_time, amount_hash, previous_hash)
  VALUES (NEW.id, NEW.drop_id, NEW.user_id, v_action, NEW.amount_cents, v_new_hash, v_prev_hash);

  NEW.amount_hash := v_new_hash;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_bid_change BEFORE INSERT OR UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.log_bid_change();

-- Immuabilité des champs critiques d'un bid (drop_id, user_id)
-- Un user ne doit pas pouvoir « déplacer » son bid d'un drop à un autre via UPDATE.
CREATE OR REPLACE FUNCTION public.prevent_bid_immutable_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.drop_id IS DISTINCT FROM NEW.drop_id THEN
    RAISE EXCEPTION 'bids.drop_id est immuable';
  END IF;
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'bids.user_id est immuable';
  END IF;
  IF OLD.submitted_at IS DISTINCT FROM NEW.submitted_at THEN
    RAISE EXCEPTION 'bids.submitted_at est immuable (tie-break critique)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bids_immutable BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.prevent_bid_immutable_change();

-- bid_count cache sur drops
CREATE OR REPLACE FUNCTION public.update_drop_bid_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.drops SET bid_count = bid_count + 1 WHERE id = NEW.drop_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status <> 'active' THEN
      UPDATE public.drops SET bid_count = GREATEST(0, bid_count - 1) WHERE id = NEW.drop_id;
    ELSIF OLD.status <> 'active' AND NEW.status = 'active' THEN
      UPDATE public.drops SET bid_count = bid_count + 1 WHERE id = NEW.drop_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_drop_bid_count AFTER INSERT OR UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.update_drop_bid_count();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drop_follows ENABLE ROW LEVEL SECURITY;

-- Forcer RLS même sur le propriétaire (paranoïa sealed-bid)
ALTER TABLE public.bids FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bid_audit_log FORCE ROW LEVEL SECURITY;

-- ----- profiles -----
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ----- brands -----
CREATE POLICY brands_select_active_public ON public.brands
  FOR SELECT USING (status = 'active');
CREATE POLICY brands_admin_all ON public.brands
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.brand_admins WHERE brand_id = brands.id AND user_id = auth.uid())
  );

-- ----- brand_admins -----
CREATE POLICY brand_admins_select_own ON public.brand_admins
  FOR SELECT USING (user_id = auth.uid());

-- ----- drops -----
CREATE POLICY drops_select_public ON public.drops
  FOR SELECT USING (status IN ('scheduled', 'open', 'closed', 'revealed'));
CREATE POLICY drops_select_brand_admin ON public.drops
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.brand_admins WHERE brand_id = drops.brand_id AND user_id = auth.uid())
  );
CREATE POLICY drops_brand_admin_manage ON public.drops
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.brand_admins WHERE brand_id = drops.brand_id AND user_id = auth.uid())
  );

-- ----- BIDS — LE COEUR SEALED-BID -----
-- SELECT : uniquement ses propres bids, jamais ceux des autres, jamais via brand admin.
CREATE POLICY bids_select_own ON public.bids
  FOR SELECT USING (user_id = auth.uid());

-- INSERT : auth obligatoire + KYC verified + drop ouvert + montant >= floor + pas double bid.
CREATE POLICY bids_insert_own_kyc ON public.bids
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND kyc_status = 'verified'
    )
    AND EXISTS (
      SELECT 1 FROM public.drops d
      WHERE d.id = drop_id
        AND d.status = 'open'
        AND now() < d.bid_lock_at
        AND amount_cents >= d.floor_price_cents
    )
  );

-- UPDATE : seulement ses bids, drop encore ouvert avant lock, et ne pas changer drop_id/user_id.
CREATE POLICY bids_update_own_before_lock ON public.bids
  FOR UPDATE USING (
    user_id = auth.uid()
    AND NOT bid_locked
    AND EXISTS (
      SELECT 1 FROM public.drops d
      WHERE d.id = drop_id
        AND d.status = 'open'
        AND now() < d.bid_lock_at
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.drops d
      WHERE d.id = drop_id
        AND amount_cents >= d.floor_price_cents
    )
  );

-- Pas de policy DELETE — les retraits passent par UPDATE status='withdrawn' (audit log préservé).

-- ----- bid_audit_log -----
-- Pas de policy SELECT public : seul service role peut lire.
-- INSERT via SECURITY DEFINER de log_bid_change(), pas de policy nécessaire.

-- ----- transactions -----
CREATE POLICY transactions_select_own ON public.transactions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY transactions_select_brand_admin ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.drops d
      JOIN public.brand_admins ba ON ba.brand_id = d.brand_id
      WHERE d.id = transactions.drop_id AND ba.user_id = auth.uid()
    )
  );

-- ----- deliveries -----
CREATE POLICY deliveries_select_own ON public.deliveries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = deliveries.transaction_id AND t.user_id = auth.uid())
  );

-- ----- drop_follows -----
CREATE POLICY follows_select_own ON public.drop_follows
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY follows_insert_own ON public.drop_follows
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY follows_delete_own ON public.drop_follows
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================================
-- FONCTION close_drop — atomique, idempotente
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

  -- Sélectionner les N gagnants (top par amount DESC, tie-break submitted_at ASC)
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

  -- Cas annulation : pas assez de bids valides
  IF v_clearing_price IS NULL OR v_winners_count = 0 THEN
    UPDATE public.drops
      SET status = 'cancelled', updated_at = now()
      WHERE id = p_drop_id;
    UPDATE public.bids
      SET status = 'invalid', updated_at = now()
      WHERE drop_id = p_drop_id AND status = 'active';
    RETURN jsonb_build_object(
      'status', 'cancelled',
      'reason', 'insufficient_bids',
      'bids_above_floor', 0
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
    'revealed_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.close_drop(UUID) FROM PUBLIC;
-- Seul le service role appellera close_drop via edge function.

-- =====================================================================
-- VUE publique drops_public (sans champs sensibles)
-- =====================================================================
CREATE OR REPLACE VIEW public.drops_public AS
SELECT
  id,
  drop_number,
  brand_id,
  title,
  piece_reference,
  description,
  floor_price_cents,
  exemplaires,
  bid_window_opens_at,
  reveal_at,
  bid_lock_at,
  status,
  CASE WHEN status = 'revealed' THEN clearing_price_cents ELSE NULL END AS clearing_price_cents,
  bid_count,
  hero_image_url,
  images_urls,
  specs,
  revealed_at
FROM public.drops
WHERE status IN ('scheduled', 'open', 'closed', 'revealed');

GRANT SELECT ON public.drops_public TO anon, authenticated;

-- =====================================================================
-- HELPER : statut bid courant pour l'utilisateur
-- =====================================================================
CREATE OR REPLACE FUNCTION public.my_bid_for_drop(p_drop_id UUID)
RETURNS public.bids
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT * FROM public.bids
  WHERE drop_id = p_drop_id AND user_id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================================
-- FIN migration 0001
-- =====================================================================
