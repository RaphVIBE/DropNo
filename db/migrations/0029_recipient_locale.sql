-- 0029 — Préférence de langue destinataire (emails FR / EN).
--
-- Les emails partent hors contexte de requête (crons, webhooks) : on stocke
-- donc la langue du destinataire pour la connaître à l'envoi.
--
-- profiles.locale     : langue du compte, posée à la connexion depuis le cookie
--                       NEXT_LOCALE (finalize-login). Éditable par l'utilisateur
--                       (préférence non sensible) → GRANT UPDATE de la colonne.
-- drop_alerts.locale  : langue capturée à l'inscription d'une alerte (visiteur
--                       sans compte), depuis la locale de la requête.
--
-- ⚠️ NON appliquée en prod : accompagne la branche i18n (à poser au déploiement).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'fr'
    CHECK (locale IN ('fr', 'en'));

-- La langue est une préférence utilisateur : on rouvre l'UPDATE de CETTE colonne
-- au rôle authenticated (le verrou 0027 ne laissait que display_name/newsletter).
GRANT UPDATE (locale) ON public.profiles TO authenticated;

ALTER TABLE public.drop_alerts
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'fr'
    CHECK (locale IN ('fr', 'en'));
