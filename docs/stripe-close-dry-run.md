# Dry-run de clôture Stripe (à exécuter une fois `STRIPE_SECRET_KEY` posée)

Objectif : valider toute la chaîne paiement d'un drop **en test**, de l'offre à
la capture au reveal, avant qu'un vrai client n'y touche. Le run réel du
2026-06-12 a perdu 8 captures faute de clé (`STRIPE_SECRET_KEY not configured`) ;
ce protocole confirme que c'est réglé.

## 0. Prérequis (côté Raphaël, dashboards)

- [ ] **`STRIPE_SECRET_KEY` posée dans les secrets EDGE FUNCTIONS** (Supabase →
  Edge Functions → Secrets), pas seulement dans Netlify. `close-drop` et
  `refund-transaction` sont des fonctions Deno qui lisent `Deno.env`.
- [ ] Stripe en **mode TEST** : la clé est `sk_test_…` et
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` est `pk_test_…` (cohérence test/test).
- [ ] Une **maison de test** + un **drop de test** créés via `/admin/produits`
  (N petit, ex. 2 exemplaires ; fenêtre de bids courte ; plancher bas).
- [ ] 2-3 **comptes acheteurs de test** (KYC Stripe Identity en mode test, ou
  bypass test si en place).

## 1. Pré-autorisations (offres)

1. Avec chaque acheteur test, poser une offre scellée sur le drop (montants
   différents, au-dessus du plancher) → `/api/bids` crée une **PaymentIntent en
   capture manuelle** (pré-auth) avec la carte test `4242 4242 4242 4242`.
2. Vérifier dans le **dashboard Stripe (test)** : autant de PaymentIntents en
   statut `requires_capture` que d'offres.
3. Vérifier en base : `bids.stripe_payment_intent_id` renseigné,
   `stripe_auth_status = 'authorized'`.

## 2. Clôture

Deux voies :
- **Attendre le reveal** (cron `dispatch_ripe_drops` + `close-drop`), ou
- **Déclencher à la main** depuis `/admin/cloture` (RelanceForm) — plus rapide
  pour un test.

`close-drop` calcule le clearing (N-ième offre ≥ plancher), **capture** les
gagnants `amount_to_capture = clearingPrice`, **release** les non-gagnants.
Idempotent (les `captured`/`released` sont sautés).

## 3. Vérifications (le cœur du test)

- [ ] **Stripe (test)** : gagnants = `succeeded` (capturés au clearing, PAS au
  montant de l'offre) ; non-gagnants = `canceled` (pré-auth relâchée).
- [ ] **`drop_close_runs`** : un run avec `captures.success = K`, `failed = 0`,
  `skipped` cohérent. (Le run cassé du 12/06 avait 8 `failed`.)
- [ ] **`transactions`** : statuts `captured` / `released` corrects, montant =
  clearing pour les gagnants.
- [ ] **`drops`** : statut `revealed`, `clearing_price_cents` renseigné.
- [ ] Email résultat reçu (gagné / non retenu) — voir aussi la délivrabilité.

## 4. Chemin remboursement (rétractation 14j)

1. `/admin/commandes/[id]` → déclencher la rétractation → `refund-transaction`.
2. Vérifier : remboursement Stripe (test) émis, `transactions` repasse en
   `refunded`, montant intégral.

## 5. Cas limites à couvrir

- [ ] **Sous-souscription** : moins d'offres que N. Défaut = vente partielle (K
  gagnent au K-ième), `all_or_nothing=true` = annulation. Vérifier les deux.
- [ ] **Capture échouée** (carte test `4000 0000 0000 0341`) : le clearing reste
  figé pour les autres, l'exemplaire devient invendu, **pas de cascade**.
- [ ] **Privilège № 001** : offre série 001 au top bidder post-reveal (dépend
  aussi de la clé).

## 6. Nettoyage

- Annuler / marquer le drop de test, noter les `transactions` de test.
- Repasser en mode live seulement quand tout est vert.

## Pièges connus

- La clé doit être un **secret Edge Function** (pas juste Netlify) — sinon
  `close-drop` relève `STRIPE_SECRET_KEY not configured` et perd les captures.
- Cohérence **test partout** (publishable + secret) sinon les PaymentIntents
  créées côté front ne sont pas visibles/capturables côté edge.
- KYC : les offres sont gatées par Stripe Identity ; prévoir le bypass test.
