-- 0028 — Provenance KYC + attributs d'identité (scaffolding itsme via broker).
--
-- Prépare la substitution KYC par itsme (login + KYC via broker Signicat) sans
-- toucher la garde de bid existante (qui reste : kyc_status='verified').
--
-- kyc_provider        : canal ayant vérifié l'identité ('stripe' | 'itsme').
-- identity_attributes : attributs vérifiés (claims itsme — nom, date de naissance,
--                       numéro de registre national, adresse, métadonnées eIDAS),
--                       conservés pour la piste d'audit AML. JSONB souple tant que
--                       le mapping exact des claims du broker n'est pas figé.
--
-- SÉCURITÉ : ces colonnes héritent du verrou 0027. Le rôle `authenticated` n'a
-- de GRANT UPDATE que sur (display_name, newsletter_subscribed) ; une nouvelle
-- colonne n'est donc PAS modifiable par l'utilisateur — uniquement par le
-- service role (helper lib/kyc/verify.ts). Aucune action requise ici pour ça.
--
-- ⚠️ NON appliquée en prod : scaffolding, à poser quand itsme sera câblé.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_provider text
    CHECK (kyc_provider IS NULL OR kyc_provider IN ('stripe', 'itsme'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_attributes jsonb;
