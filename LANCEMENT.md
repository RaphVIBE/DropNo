# Drop No. - Étapes de mise en production

Récapitulatif des actions manuelles restantes avant le lancement. Trois volets :
déploiement Vercel, activation du scheduler, purge des données de test.

---

## 1. Déploiement Vercel (intégration Git)

### 1.1 Importer le dépôt

1. Aller sur [vercel.com/new](https://vercel.com/new), puis **Add New... > Project**.
2. Importer **`RaphVIBE/DropNo`** (autoriser GitHub si demandé).
3. Le préréglage **Next.js** est détecté automatiquement : laisser les commandes
   Build / Output / Install par défaut. Répertoire racine : `./`.

### 1.2 Variables d'environnement (à ajouter AVANT le premier build)

> Important : les variables `NEXT_PUBLIC_*` sont injectées au moment du build.
> Elles doivent exister avant que le build ne tourne, sinon le client ne se
> connecte pas. À renseigner dans l'écran d'import, section Environment
> Variables (portée : Production + Preview).

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
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | optionnel (emails) |
| `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST`, `NEXT_PUBLIC_CRISP_WEBSITE_ID` | optionnel |

Cliquer ensuite sur **Deploy**.

### 1.3 Après le premier déploiement (besoin de l'URL en ligne)

Une fois l'URL `https://<votre-app>.vercel.app` obtenue :

1. **Ajouter deux variables**, puis redéployer (Deployments > ... > Redeploy) :
   - `NEXT_PUBLIC_APP_URL` = `https://<votre-app>.vercel.app`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (issu de l'étape 2 ci-dessous)
2. **Webhook Stripe** : Stripe > Developers > Webhooks > Add endpoint :
   `https://<votre-app>.vercel.app/api/stripe/webhook`. S'abonner aux événements
   `identity.verification_session.*` et `payment_intent.*`. Copier le signing
   secret (`whsec_...`) dans `STRIPE_WEBHOOK_SECRET`.

### 1.4 Allowlist Auth Supabase (sinon le magic link casse)

Supabase > **Authentication > URL Configuration** :

- **Site URL** : `https://<votre-app>.vercel.app`
- **Redirect URLs** : ajouter `https://<votre-app>.vercel.app/auth/callback`
  (et `https://*-raphvibe.vercel.app/auth/callback` pour autoriser le login sur
  les déploiements de preview).

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

- [ ] Projet Vercel importé, variables connues + secrets renseignés
- [ ] Premier déploiement OK
- [ ] `NEXT_PUBLIC_APP_URL` + `STRIPE_WEBHOOK_SECRET` ajoutés, redéploiement
- [ ] Webhook Stripe créé et abonné aux bons événements
- [ ] Domaine Vercel whitelisté dans Supabase Auth (Site URL + Redirect URLs)
- [ ] Secret Vault `service_role_key` créé + cron réactivé
- [ ] Données de test purgées
- [ ] Test bout en bout : créer une marque réelle, un drop avec `reveal_at`
      proche, soumettre des bids de test, vérifier la clôture automatique
