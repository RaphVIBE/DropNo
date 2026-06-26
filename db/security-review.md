# Revue sécurité RLS — Drop No.

Walkthrough adversarial sur le schéma `0001_init_drop_no.sql`. Objectif : valider que les bids restent strictement confidentiels.

## Modèle de menace

| Acteur | Capacité supposée |
|---|---|
| Anonyme | Requêtes via JWT anon |
| Acheteur authentifié sans KYC | JWT authenticated |
| Acheteur authentifié + KYC | JWT authenticated |
| Brand admin de drop X | JWT authenticated + entrée `brand_admins` |
| Service role (cron, edge) | JWT service_role, BYPASSRLS |
| Founder admin | Service role + supabase_admin |

Hypothèse : Stripe, Supabase Auth et Netlify sont configurés correctement (hors scope RLS).

## Walkthrough

### Sur les bids (table critique)

| # | Tentative | Résultat | Raison |
|---|---|---|---|
| A1 | Acheteur Y lit les bids de l'acheteur X | 0 rows | `bids_select_own` USING `user_id = auth.uid()` |
| A2 | Brand admin lit les bids de son drop | 0 rows | Seule policy SELECT vérifie `user_id = auth.uid()` ; brand admin n'est jamais le bidder |
| A3 | Anonyme lit des bids | 0 rows | Pas de policy pour anon, RLS bloque |
| A4 | Acheteur sans KYC INSERT un bid | rejeté | `bids_insert_own_kyc` exige `kyc_status='verified'` |
| A5 | Acheteur INSERT en-dessous du floor | rejeté | Policy vérifie `amount_cents >= floor_price_cents` |
| A6 | Acheteur INSERT sur drop fermé | rejeté | Policy vérifie `status='open' AND now() < bid_lock_at` |
| A7 | Acheteur INSERT 2 bids sur même drop | rejeté | `UNIQUE(drop_id, user_id)` |
| A8 | Acheteur UPDATE son bid en-dessous du floor | rejeté | WITH CHECK vérifie `amount_cents >= floor` |
| A9 | Acheteur UPDATE son bid après bid_lock_at | rejeté | USING vérifie `now() < bid_lock_at` |
| A10 | Acheteur UPDATE drop_id pour migrer son bid | rejeté | Trigger `prevent_bid_immutable_change` (ajouté en revue) |
| A11 | Acheteur UPDATE user_id pour reattribuer | rejeté | Trigger immutability + WITH CHECK |
| A12 | Acheteur DELETE son bid | rejeté | Pas de policy DELETE (forcer retrait via UPDATE status='withdrawn') |
| A13 | Acheteur UPDATE submitted_at pour gagner tie-break | rejeté | Trigger immutability |
| A14 | Acheteur appelle `close_drop()` directement | rejeté | `REVOKE EXECUTE FROM PUBLIC`, function `SECURITY DEFINER` mais inaccessible |
| A15 | Race condition double-INSERT concurrent | gérée | UNIQUE constraint + transaction Postgres |

### Sur les drops

| # | Tentative | Résultat | Raison |
|---|---|---|---|
| B1 | Anonyme voit un drop `draft` | 0 rows | `drops_select_public` filtre statut |
| B2 | Anonyme voit `clearing_price_cents` avant reveal | NULL | Vue `drops_public` masque tant que `status <> 'revealed'` |
| B3 | Brand admin crée un drop pour une autre marque | rejeté | `drops_brand_admin_manage` vérifie `brand_admins.brand_id = drops.brand_id` |

### Sur l'audit log

| # | Tentative | Résultat | Raison |
|---|---|---|---|
| C1 | Acheteur lit son audit_log | 0 rows | RLS sans policy SELECT, pas accessible JWT |
| C2 | Brand admin lit audit_log | 0 rows | Idem |
| C3 | Acheteur INSERT direct dans audit_log | rejeté | RLS sans policy INSERT — passe seulement via trigger SECURITY DEFINER |
| C4 | Acheteur falsifie un hash | impossible | Trigger SECURITY DEFINER recalcule le hash côté serveur |

### Sur transactions / deliveries

| # | Tentative | Résultat | Raison |
|---|---|---|---|
| D1 | Acheteur Y voit transactions de X | 0 rows | `transactions_select_own` |
| D2 | Brand admin voit transactions de son drop | OK | `transactions_select_brand_admin` (intentionnel — payout reconciliation) |
| D3 | Brand admin déduit prix-par-user d'un autre drop | rejeté | Filtré par `drop.brand_id` dans la jointure |

## Defense in depth

- **`FORCE ROW LEVEL SECURITY`** sur `bids` et `bid_audit_log` : même un futur owner exempt-by-default reste soumis aux policies. Seul `BYPASSRLS` explicite (postgres role) passe outre.
- **`SECURITY DEFINER` sur `close_drop`** : exécuté avec privilèges `postgres`, bypass RLS — c'est le seul endroit autorisé à muter en masse.
- **Hash chain dans `bid_audit_log`** : chaque insert contient le hash de la version précédente, détecte toute altération à postériori.
- **Constraints CHECK** : floor minimum (3000€), fenêtre min 1h, exemplaires entre 1 et 100. Le front ne peut pas relâcher ces limites.

## Risques résiduels identifiés

| # | Risque | Mitigation actuelle | Action complémentaire suggérée |
|---|---|---|---|
| R1 | Brand admin observe `bid_count` croître en quasi temps réel et infère l'intérêt | Volontaire (transparence agrégée OK) | Aucune |
| R2 | Brand admin voit `amount_paid_cents` post-reveal (= clearing price) | Volontaire (payout) | Aucune |
| R3 | Compromission du service role (clé fuit) | Stockage Netlify encrypted env, rotation 90j | Audit log pull externe (Datadog), alerte sur usage abusif |
| R4 | Bug logique edge function `closeDrop` | Tests automatisés exhaustifs | Dry-run sur staging avant chaque drop, runbook incident |
| R5 | Bidder révoqué KYC après bid | Pas de recheck KYC sur UPDATE | À discuter : faut-il invalider les bids si KYC perdu ? |
| R6 | Acheteur retire son bid à T-23h, libère sa pré-auth, dépose un nouveau bid avec montant différent | Permis par design (modifiable jusqu'à T-1h) | Documenter en CGV |

## Verdict

Le schéma respecte le principe sealed-bid : aucun acteur (sauf le bidder lui-même et le service role) ne peut lire un bid avant la révélation. La défense en profondeur (RLS + FORCE + CHECK + triggers immuabilité + audit log) ferme les vecteurs de fuite probables côté base.

**Recommandation avant launch** : pentest externe focalisé sur le close window (T-5min → T+15min) où la complexité est maximale. Budget estimé 5-10k€ pour un audit ciblé Cure53 / Synacktiv.
