# Drop No. — Supabase backend

Projet : **ygzyzvjxregoqbzmcmyq** (eu-west-3 Paris)
URL : https://ygzyzvjxregoqbzmcmyq.supabase.co

## Structure

```
db/
  migrations/
    0001_init_drop_no.sql       # Schéma + RLS + close_drop()    [appliquée]
    0002_harden_security.sql    # Fixes advisories              [appliquée]
    0003_scheduler.sql          # pg_cron dispatcher            [à appliquer]
  schema-design.md
  security-review.md
supabase/
  functions/
    close-drop/
      index.ts                   # Edge function principale
      deno.json
```

## Mécanique de fermeture des drops

```
pg_cron (chaque minute)
   │
   ▼
public.dispatch_ripe_drops()        ─── SQL, scan les drops mûrs
   │
   ▼ HTTP POST via pg_net
edge function close-drop
   │
   ├── 1. supabase.rpc('close_drop', { p_drop_id })    ─── atomique, transactionnel
   │       └── tri bids, assigne winners/losers, crée transactions
   │
   ├── 2. Stripe : capture winners au clearing_price
   │
   └── 3. Stripe : cancel pré-auth des losers
```

L'edge function est **idempotente** : si elle échoue mi-chemin, le re-trigger reprend là où elle s'est arrêtée (skip des bids déjà `captured` ou `released`).

## Déploiement

### 1. Activer les extensions Postgres requises

Dashboard Supabase → Database → Extensions, activer :
- `pg_cron` (déjà disponible)
- `pg_net` (déjà disponible)

Sinon en SQL :
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Stocker les settings utilisés par le dispatcher (Supabase Vault)

Le scheduler a besoin de l'URL du projet et du service_role_key. **Important :** sur
Supabase le rôle `postgres` n'est pas superuser, donc `ALTER DATABASE/ROLE SET
app.settings.*` échoue (permission denied). On utilise donc **Vault** (migration
0004). À configurer **une seule fois** :

```sql
-- URL du projet (non sensible) — déjà créé par l'agent si besoin
select vault.create_secret(
  'https://ygzyzvjxregoqbzmcmyq.supabase.co', 'edge_function_url', 'Base URL projet');

-- service_role_key : Dashboard → Settings → API (sensible, ne pas committer)
select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key', 'Clé service role');
```

Puis **réactiver** le cron (créé désactivé en mode sûr) :

```sql
select cron.alter_job(
  (select jobid from cron.job where jobname = 'dispatch_ripe_drops_every_minute'),
  active := true);
```

Pour mettre à jour un secret existant : `vault.update_secret(<uuid>, '<valeur>')`.

### 3. Déployer l'edge function

Via Supabase CLI :
```bash
supabase functions deploy close-drop --project-ref ygzyzvjxregoqbzmcmyq
```

Ou via MCP (depuis cette conversation) : voir `deploy_edge_function`.

### 4. Configurer les secrets edge function

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_... --project-ref ygzyzvjxregoqbzmcmyq
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement par Supabase dans l'environnement de l'edge function.

### 5. Appliquer la migration scheduler

```bash
supabase db push --project-ref ygzyzvjxregoqbzmcmyq
```

Ou via MCP : `apply_migration` avec `0003_scheduler.sql`.

## Vérification post-déploiement

### Edge function up
```bash
curl -X POST https://ygzyzvjxregoqbzmcmyq.supabase.co/functions/v1/close-drop \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"drop_id":"00000000-0000-0000-0000-000000000000"}'
# attendu : 500 avec "Drop ... introuvable" si UUID inexistant.
```

### Cron actif
```sql
SELECT * FROM cron.job WHERE jobname = 'dispatch_ripe_drops_every_minute';
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

## Variables d'env edge function

| Var | Source | Usage |
|---|---|---|
| `SUPABASE_URL` | injecté Supabase | client supabase-js |
| `SUPABASE_SERVICE_ROLE_KEY` | injecté Supabase | accès service role |
| `STRIPE_SECRET_KEY` | `supabase secrets set` | API Stripe |

## Sécurité

- L'edge function utilise `SERVICE_ROLE_KEY` → bypasse RLS, nécessaire pour mass-update des bids.
- L'endpoint est public mais protégé par `Authorization: Bearer SERVICE_ROLE_KEY`. Toute requête sans ce token est rejetée par Supabase avant d'atteindre la fonction.
- Le pg_cron `dispatch_ripe_drops()` est `SECURITY DEFINER` et `REVOKE ALL FROM anon, authenticated, PUBLIC` — seul le scheduler postgres peut l'exécuter.

## Roadmap edge functions à venir

| Function | Statut | Description |
|---|---|---|
| `close-drop` | écrite | Révélation + Stripe capture/release |
| `stripe-webhook` | TODO | Réception events Stripe (auth_expired, charge.refunded, etc.) |
| `seed-drop` | TODO | Création d'un drop par une marque (validation contractuelle) |
| `kyc-callback` | TODO | Réception du résultat Stripe Identity, MAJ profiles.kyc_status |
| `process-bid` | TODO (option) | Wrap INSERT bid avec création paymentIntent Stripe atomique |
