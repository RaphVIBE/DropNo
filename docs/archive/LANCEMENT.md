# Drop No. - Étapes de mise en production

Récapitulatif des actions manuelles restantes avant le lancement. Trois volets :
déploiement Netlify, activation du scheduler, purge des données de test.

> Hébergement retenu : **Netlify** (projet `dropno` déjà connecté au dépôt). Le
> build est piloté par `netlify.toml` (Node 20, runtime Next.js OpenNext
> auto-géré). Chaque push sur `main` déclenche un déploiement de production ;
> chaque PR génère une Deploy Preview.

---

## 1. Déploiement Netlify

### 1.1 Le dépôt est déjà connecté

Le projet Netlify `dropno` build le dépôt `RaphVIBE/DropNo`. Rien à réimporter.
La configuration de build vit dans `netlify.toml` (commande `npm run build`,
`NODE_VERSION = 20`). Le runtime Next.js est détecté automatiquement.

### 1.2 Variables d'environnement (à ajouter AVANT le prochain build)

Netlify : **Site configuration > Environment variables**. Portée : laisser
« All scopes » (Production + Deploy previews) sauf besoin contraire.

> Important : les variables `NEXT_PUBLIC_*` sont injectées au moment du build.
> Sur Netlify, modifier une variable ne suffit pas : il faut **relancer un
> déploiement** (Deploys > Trigger deploy > Clear cache and deploy site) pour
> que la nouvelle valeur soit prise en compte.

**Valeurs connues (à coller telles quelles)**

| Nom | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ygzyzvjxregoqbzmcmyq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_CCtEsFQO-3MxGwmIP-jjlg_dsJvjOKn` |
| `NEXT_PUBLIC_APP_ENV` | `production` |

**Secrets (à récupérer dans les dashboards respectifs)**

| Nom | Où le trouver |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API > service_role |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe > Developers > API keys (`pk_...`) |
| `STRIPE_SECRET_KEY` | Stripe > API keys (`sk_...`) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Resend (emails) |
| `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST`, `NEXT_PUBLIC_CRISP_WEBSITE_ID` | optionnel |

Déclencher ensuite un déploiement (Trigger deploy > Clear cache and deploy site).

### 1.3 Après le premier déploiement de production (besoin de l'URL)

URL de production : `https://dropno.netlify.app` (ou le domaine personnalisé
configuré dans Domain management).

1. **Ajouter deux variables**, puis redéployer (cache vidé) :
   - `NEXT_PUBLIC_APP_URL` = `https://dropno.netlify.app` (ou domaine custom)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (issu de l'étape 2 ci-dessous)
2. **Webhook Stripe** : Stripe > Developers > Webhooks > Add endpoint :
   `https://dropno.netlify.app/api/stripe/webhook`. S'abonner aux événements
   `identity.verification_session.*` et `payment_intent.*`. Copier le signing
   secret (`whsec_...`) dans `STRIPE_WEBHOOK_SECRET`.

### 1.4 Allowlist Auth Supabase (sinon le magic link casse)

Supabase > **Authentication > URL Configuration** :

- **Site URL** : `https://dropno.netlify.app` (ou domaine custom)
- **Redirect URLs** : ajouter
  - `https://dropno.netlify.app/auth/callback`
  - `https://deploy-preview-*--dropno.netlify.app/auth/callback` (login sur les
    Deploy Previews de PR)
  - le domaine custom + `/auth/callback` le cas échéant

---

## 2. Activer le scheduler (cron de clôture des drops)

Le cron `dispatch_ripe_drops_every_minute` est en place mais **désactivé** (mode
sûr). Sur ce projet, le rôle `postgres` n'est pas superuser : on passe donc par
**Supabase Vault** (pas par `ALTER DATABASE ... SET app.settings.*`).

À exécuter une seule fois dans le **SQL Editor du dashboard Supabase** :

```sql
-- 1. Stocker le service_role_key (Dashboard > Settings > API > service_role)
select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key', 'Clé service role');

-- 2. Réactiver le cron (toutes les minutes)
select cron.alter_job(
  (select jobid from cron.job where jobname = 'dispatch_ripe_drops_every_minute'),
  active := true);
```

> Le secret `edge_function_url` est déjà créé dans Vault. Pour suivre l'exécution :
> `select * from cron.job_run_details order by start_time desc limit 5;`

> Lifecycle : le cron `open_ripe_drops_every_minute` (migration 0007) est déjà
> **actif** et fait passer les drops `scheduled` -> `open` à `bid_window_opens_at`
> (pur SQL, aucun secret requis). Seule la clôture (`dispatch_ripe_drops`) attend
> l'activation ci-dessus.

---

## 2b. Notifications email (US-22)

Deux déclencheurs, un seul secret partagé `NOTIFY_SECRET` (générer une valeur,
ex. `openssl rand -hex 32`, et l'utiliser PARTOUT) :

- **Emails de résultat** (gagné / non retenu) : `close-drop` appelle
  `/api/notifications/drop-results` après chaque clôture révélée.
- **Rappels** (ouverture / T-24h / T-1h) : un cron `dispatch_reminders` (toutes
  les 5 min, créé désactivé) pinge `/api/notifications/reminders`, qui scanne
  les rappels dus et les envoie aux followers + bidders actifs.

Réglages, une seule fois (même valeur `NOTIFY_SECRET` partout) :

1. **Netlify** (Environment variables) : `NOTIFY_SECRET` + `RESEND_API_KEY`
   (sinon les envois sont no-op).
2. **Supabase — secrets edge function** (pour les emails de résultat) :
   `supabase secrets set NOTIFY_SECRET=... APP_URL=https://dropno.netlify.app`,
   puis redéployer : `supabase functions deploy close-drop --project-ref ygzyzvjxregoqbzmcmyq`.
3. **Supabase — Vault** (pour le cron rappels) : le secret `app_url` est déjà
   créé ; ajouter `notify_secret` (même valeur) puis activer le cron :
   ```sql
   select vault.create_secret('<NOTIFY_SECRET>', 'notify_secret', 'Secret notifications');
   select cron.alter_job(
     (select jobid from cron.job where jobname = 'dispatch_reminders_every_5_min'),
     active := true);
   ```

Les deux flux sont best-effort : un échec d'email n'interrompt jamais la
clôture. Les rappels ne partent que pour les drops en statut `open`.

---

## 3. Purger les données de test

Une marque fictive (Maison Lévrier) et 4 drops ont été seedés pour vérifier les
écrans. À supprimer avant la prod. Dans le SQL Editor Supabase :

```sql
-- Supprime les drops de la marque de test, puis la marque.
-- (Pas de bids/transactions de test : suppression directe.)
delete from drops
  where brand_id = (select id from brands where slug = 'maison-levrier');

delete from brands where slug = 'maison-levrier';
```

> S'il existe des bids/transactions/livraisons rattachés (ce n'est pas le cas du
> seed), les supprimer d'abord dans cet ordre : deliveries, transactions, bids,
> drops, brands.

---

## Checklist finale avant lancement

- [ ] Variables connues + secrets renseignés dans Netlify (Environment variables)
- [ ] Déploiement de production OK (Clear cache and deploy)
- [ ] `NEXT_PUBLIC_APP_URL` + `STRIPE_WEBHOOK_SECRET` ajoutés, redéploiement (cache vidé)
- [ ] Webhook Stripe créé et abonné aux bons événements
- [ ] Domaine Netlify whitelisté dans Supabase Auth (Site URL + Redirect URLs)
- [ ] Login magic link testé sur une Deploy Preview ou en production
- [ ] Secret Vault `service_role_key` créé + cron réactivé
- [ ] Données de test purgées
- [ ] Test bout en bout : créer une marque réelle, un drop avec `reveal_at`
      proche, soumettre des bids de test, vérifier la clôture automatique
