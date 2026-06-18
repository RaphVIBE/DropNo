# Drop No. — Schéma de base de données

## Principes directeurs

**1. Sealed = invisible à tous sauf au propriétaire, jusqu'à la révélation.**
Les bids ne doivent jamais être lus par :
- d'autres acheteurs
- la marque qui vend
- l'équipe Drop No. (sauf service role pour le closeDrop)
Seul le bidder lui-même voit son propre bid. La marque voit un compteur agrégé (nombre de bids), jamais les montants.

**2. Append-only audit log.**
Toute insertion/modification de bid laisse une trace hashée immuable dans `bid_audit_log`. Defense juridique en cas de litige sur l'ordre d'arrivée.

**3. Atomicité du closeDrop.**
La fonction `close_drop(drop_id)` doit être transactionnelle, idempotente et exécutée avec `SECURITY DEFINER` (contourne RLS). Lock du drop, tri des bids, attribution, marquage, mise à jour. Atomique : la résolution réussit en bloc ou rollback complet.

**4. Pas de service role en runtime utilisateur.**
Tout le code utilisateur (Next.js front + edge functions) utilise un JWT anon. Le service role est réservé aux cron de fermeture des drops et au backend admin.

---

## Tables (8)

### `profiles`
Étend `auth.users` (Supabase Auth) avec KYC, Stripe customer ID, préférences.

### `brands`
Marques vendeuses. Status `pending` → `active` après validation manuelle (Kbis + contrat signé).

### `brand_admins`
Junction : qui peut gérer quelle marque. Permet à plusieurs personnes côté marque d'accéder au back-office.

### `drops`
Événements de vente. Status workflow : `draft` → `scheduled` → `open` → `closed` → `revealed`. Possible : `cancelled`.

Colonne `bid_lock_at` calculée automatiquement (reveal_at - 1h).

### `bids` (la table critique)
Une ligne par bid actif. **Unique constraint** sur (drop_id, user_id) — un seul bid par user par drop, modifiable. Modifications conservées dans `bid_audit_log`.

### `bid_audit_log`
Append-only. Hash chain : chaque ligne contient le hash de l'état actuel + le hash de l'état précédent. Détection de toute altération.

### `transactions`
Créées par le closeDrop pour les gagnants uniquement. Lien vers Stripe charge ID. Tracking de la fenêtre rétractation 14j.

### `deliveries`
Suivi logistique. Carrier obligatoire (`dhl`, `malca_amit`, `brinks`).

### `drop_follows`
Junction acheteur → drop. Notifications de pré-ouverture.

---

## RLS — résumé des policies

| Table | Public (anon) | User authentifié | Brand admin | Service role |
|---|---|---|---|---|
| `profiles` | – | SELECT/UPDATE own | – | full |
| `brands` | SELECT where active | SELECT where active | full on own brand | full |
| `drops` | SELECT scheduled/open/closed/revealed | + | + draft on own brand | full |
| `bids` | – | SELECT/INSERT/UPDATE own (avec contraintes) | – (jamais) | full |
| `bid_audit_log` | – | – | – | full |
| `transactions` | – | SELECT own | – | full |
| `deliveries` | – | SELECT own | – | full |
| `drop_follows` | – | SELECT/INSERT/DELETE own | – | full |

**Brand admin ne voit JAMAIS les bids individuels** de son drop, même après révélation. Ils voient le clearing price (`drops.clearing_price_cents`) et le compteur agrégé. C'est volontaire : si une fuite arrivait du côté marque, le mécanisme sealed serait compromis.

---

## Validation au niveau SQL

Les RLS bloquent l'accès, mais le check de validité métier est dans les contraintes :

- `bids.amount_cents` ≥ `drops.floor_price_cents` (vérifié dans la policy INSERT)
- `drops.status = 'open' AND now() < drops.bid_lock_at` (vérifié dans la policy INSERT/UPDATE)
- `profiles.kyc_status = 'verified'` (vérifié dans la policy INSERT)
- `drops.floor_price_cents >= 300000` (3000 € minimum, CHECK constraint)

Cette défense en profondeur protège même contre un bug côté front.

---

## Fonction `close_drop(drop_id)`

Exécutée à `reveal_at` exact par cron (Supabase Edge Function planifiée).

Algorithme :
1. `SELECT … FOR UPDATE` sur le drop (lock).
2. Tri des bids actifs par `amount_cents DESC, submitted_at ASC`.
3. Top N (au plus) = gagnants. Clearing price = la plus basse offre gagnante (N-ième bid, ou K-ième si seulement K < N offres ≥ floor).
4. Annulation si : zéro bid ≥ floor, **ou** `drops.all_or_nothing = true` et offres qualifiées < N. Sinon, vente partielle autorisée (K exemplaires vendus, N−K invendus).
5. Cas vendu : marquer gagnants `won`, perdants `lost`, créer transactions pour gagnants au clearing.
6. Update `drops.status = 'revealed'`, `clearing_price_cents`, `revealed_at`.
7. La logique Stripe (capture / release) est dans une edge function TypeScript qui suit cette fonction SQL.

Garanties : idempotente (re-run avec drop déjà `revealed` lève exception explicite), transactionnelle (rollback complet si erreur).

---

## Index principaux

- `drops(status)` — listing pages
- `drops(reveal_at) WHERE status = 'open'` — cron scan
- `bids(drop_id, amount_cents DESC) WHERE status = 'active'` — closeDrop
- `bids(user_id)` — dashboard user
- `bid_audit_log(drop_id)` — forensics

---

## Décisions en suspens

1. **Chiffrement at-rest des amounts ?**
   Postgres column encryption (pgsodium) augmente la friction dev. RLS strict + accès admin restreint (founders only) + audit log sont déjà solides. Reco MVP : skip pgsodium, ajouter si audit sécurité externe le demande.

2. **Hash chain dans audit_log : SHA-256 simple ou Merkle ?**
   SHA-256 chaîné (previous_hash) suffit pour détecter altération. Merkle tree overkill au MVP.

3. **Multi-currency ?**
   Schéma actuel : tout en cents EUR. Ajout v2 = colonne `currency` + table de conversion. Pas MVP.

4. **Soft delete vs hard delete des bids retirés ?**
   Reco : statut `withdrawn` (pas de DELETE physique), pour préserver audit log.
