# Drop No. — Back-office (admin & espace maison)

Couche d'administration ajoutée **dans la même app** Next.js, en réutilisant `lib/supabase`, l'auth `/login` + `/auth/callback` et le design system. Deux zones protégées par rôle :

- **`/admin`** — back-office opérateur plateforme (toi).
- **`/maison`** — espace responsables de maison (sur invitation).

Le tout en **thème dark** (variante du design system), tandis que la vitrine reste en light.

## Rôles & accès

| Rôle | Source | Accès |
|---|---|---|
| `platform_admin` | table `platform_admins` + helper `is_platform_admin()` | tout `/admin` |
| `maison_manager` | table `brand_admins` (existante, role `admin`/`viewer`) | `/maison` (sa/ses marques) |
| client | `profiles` | `/account` (vitrine) |

- `lib/admin/auth.ts` → `getRole()` résout le rôle depuis la session.
- `lib/supabase/middleware.ts` → `PROTECTED_PREFIXES = ["/account", "/admin", "/maison"]`.
- `lib/construction-gate.ts` → `/admin`, `/maison`, `/dev-login` sont allowlistés (hors vitrine « bientôt »).
- `app/auth/callback/route.ts` → après login, honore `?redirect=…` ; sinon route les `platform_admin` vers `/admin`, les clients vers `/account/dashboard`. `app/login/page.tsx` transmet `?redirect=` dans le lien magique.

### Devenir admin
```sql
insert into public.platform_admins (user_id)
select id from public.profiles where email = 'raph@veracruz.be'
on conflict do nothing;
```
(Déjà fait pour `raph@veracruz.be`.)

### Connexion dev (local, sans email)
`/dev-login` — connexion par mot de passe, **désactivée en production** (`NODE_ENV`). Mot de passe posé en base sur `auth.users` pour `raph@veracruz.be`. À régénérer/supprimer avant prod. Le magic-link reste la voie normale ; `/dev-login` contourne juste le SMTP en local.

## Thème dark

Pas de duplication : `app/globals.css` définit un bloc `.admin { … }` qui **réinverse les variables CSS** du design system (fond brun quasi-noir, encre off-white, accent champagne conservé). Comme toutes les classes Tailwind pointent vers `var(--…)`, l'ensemble de `/admin` et `/maison` rend en dark sans changer une seule classe. Les layouts (`app/admin/layout.tsx`, `app/maison/layout.tsx`) enveloppent le contenu dans `<div className="admin …">`.

Primitives UI partagées : `lib/admin/ui.tsx` (`Badge`, `Card`, `Kpi`, `PageHeader`), `components/admin/nav.tsx` (sidebar), `components/admin/tabs.tsx` (onglets vue d'ensemble/historique). CTA via le `Button` shadcn existant.

## Surfaces

| Route | Fichiers | Rôle |
|---|---|---|
| Vue d'ensemble + calendrier | `app/admin/page.tsx` | drop en cours (bids, **prix provisoire N-ième**, demande, J−reveal) ; calendrier des drops à venir avec décalage ±jour/±semaine (`shiftDrop`) et lien création |
| Historique | `app/admin/historique/page.tsx` | drops révélés/annulés : prix de clôture, exemplaires vendus, CA brut, payout (KPIs cumulés) |
| **Console de clôture** | `app/admin/cloture/{page,[id],actions,RelanceForm}` | runs `close-drop` persistés, santé des crons, règlement Stripe par bid (post-reveal), **relance manuelle** idempotente via l'edge function |
| **Finance / payouts** | `app/admin/finance/{page,actions,PayerForm}` | dû maison par drop révélé (calcul live depuis transactions), gating rétractation 14j + règlement complet, **marquer payé** (snapshot + réf. virement), détection d'écart post-remboursement |
| **Plateforme** | `app/admin/plateforme/{page,actions,AjouterAdminForm}` | équipe d'admins (ajout par email, retrait — owners only, garde DB dernier-owner) + **journal d'audit des enchères** (`get_bid_audit`, montants masqués pré-reveal, filtres + pagination) |
| Produits / Drops | `app/admin/produits/{page,new,[id],actions,DropForm}` | CRUD + planning des fenêtres ; garde-fous par statut |
| Commandes & livraisons | `app/admin/commandes/{page,[id],actions,RembourserForm}` | paiement + fulfillment (DHL/Malca-Amit/Brink's), workflow de statut, **rétractation 14j + remboursement Stripe** (edge function `refund-transaction`), **retour sécurisé** (trajet inverse : direction, valeur assurée, lien tracking DHL) |
| **Audience** | `app/admin/audience/page.tsx` | trafic vitrine 7/30j, courbe, géographie, acquisition (referrers), devices, top montres vues — données PostHog |
| Clients & comptes | `app/admin/clients/{page,[id]}` | visibilité KYC + activité (lecture seule) |
| Maisons & invitations | `app/admin/maisons/{page,new,[id],actions,MaisonForm}` | fiche verrouillée (compteurs) + invitations email (service role) |
| Support | `app/admin/support/{page,new,[id],actions}` | tickets + fil de messages + notes internes, statut/priorité/assignation |
| Dashboard maison | `app/maison/{layout,page}` | vue responsables via `get_maison_drop_metrics` (agrégés, gating reveal) |

Domaines (labels, validations, transitions) : `lib/admin/{drops,orders,clients,maisons,support,cloture,finance,plateforme,format}.ts`.

### Rétractation & remboursements — fonctionnement

- Workflow par commande (`withdrawal_requests`, une par transaction) : demandée → retour en transit → pièce reçue → remboursée | refusée (motif obligatoire). Opéré depuis la carte « Rétractation & remboursement » de `/admin/commandes/[id]`. « Pièce reçue » passe aussi la livraison en `returned`.
- Création possible après la fenêtre 14j (geste commercial), signalée en orange. Remboursement **intégral** uniquement (décision verrouillée).
- Le refund passe par l'edge function **`refund-transaction`** (service role) : `stripe.refunds.create({ payment_intent })` avec clé d'idempotence `refund-<tx>` → pas de double refund possible. Met à jour `transactions.status='refunded'` + la rétractation, et persiste chaque tentative (ok/échec) dans `refund_runs` (visible sur la commande).
- Garde server action : refund refusé tant que la rétractation n'est pas « Pièce reçue ». ⚠️ Dépend de `STRIPE_SECRET_KEY` (secret edge function, actuellement absente).
- **Retour logistique** (0025) : `deliveries.direction` outbound|return, au plus une ligne par trajet (`UNIQUE (transaction_id, direction)`), valeur assurée en cents (reco : prix de clôture) + notes. Côté retour, mêmes statuts DB mais labels dédiés (`RETURN_FR` : delivered = « reçue »). Marquer la rétractation « Pièce reçue » passe l'aller en `returned` et le retour en `delivered`. Lien de suivi public pour DHL (`trackingUrl`), Malca-Amit/Brink's = concierge hors ligne.

### Analytics / Audience — fonctionnement

- **Tracking vitrine** (sans dépendance npm, snippet officiel) : `components/analytics/PostHogScript` injecté dans `app/layout.tsx` si `NEXT_PUBLIC_POSTHOG_KEY` est posée. `PageviewTracker` capture les `$pageview` à chaque navigation App Router et **exclut** `/admin`, `/maison`, `/dev*` (zéro pollution interne). `DropViewTracker` émet l'event métier **`drop_view`** sur chaque page `/drop/[id]` (props : drop_id, drop_number, drop_title, brand, drop_status). Config : autocapture off, profils identified_only, GeoIP automatique côté PostHog.
- **Lecture côté admin** : `lib/analytics/posthog.ts` (server only) interroge la **HogQL Query API** avec `POSTHOG_PROJECT_ID` + `POSTHOG_PERSONAL_API_KEY` (scope query:read) ; cache mémoire 5 min. Sans clés ou en erreur → `null` partout, l'UI affiche « Audience non branchée » (jamais bloquant).
- **Cadrans** : vue d'ensemble `/admin` (visiteurs/vues 7j + sparkline 14j + vues/visiteurs/conversion vue→bid du drop en cours), fiche drop `/admin/produits/[id]` (vues 90j, courbe 30j, top pays, conversion vue→bid), page `/admin/audience` (vue marketing complète). Widgets SVG maison dans `components/admin/analytics.tsx` (Sparkline, BarList) — pas de lib de charts.
- La **conversion vue → bid** croise PostHog (visiteurs uniques du drop) et la DB (`bid_count`).

### Plateforme — fonctionnement

- **Équipe** : rôles `owner` (gère l'équipe) / `staff` (tout le reste). Écritures sur `platform_admins` via RLS `is_platform_owner()` — plus de SQL à la main. Trigger `protect_last_owner` : impossible de supprimer/déclasser le dernier owner (anti-lockout). Pas d'auto-retrait depuis l'UI. L'ajout exige un profil existant (la personne s'est connectée au moins une fois).
- **Journal des enchères** : `get_bid_audit()` expose `bid_audit_log` (append-only, hash chain) à l'admin avec **montants masqués tant que le drop n'est pas revealed/cancelled** — l'opérateur ne voit pas les offres en cours, conformément au sealed-bid. Filtres drop + action, pagination.
- L'audit des **actions admin** (édition drops, payouts, fulfillment) n'existe pas encore — à créer avec les actions destructives (annulation de drop, bannissement).

### Finance / payouts — fonctionnement

- **Pas de machine à états stockée** : le dû se recalcule en live depuis `transactions` (somme des `brand_payout_cents` capturés, remboursés exclus). Seul l'événement irréversible est stocké : `drop_payouts` = journal des virements (snapshot units/gross/fee/net + référence).
- Statuts dérivés : `bloqué` (tx pending/failed → régler dans Clôture) → `en rétractation` (max `withdrawal_window_ends_at` futur) → `à payer` → `payé`. `marquerPaye` re-vérifie ces gardes **côté serveur** et recalcule les montants (jamais depuis le formulaire).
- Si un remboursement intervient après le virement, l'écart snapshot vs calcul live s'affiche en rouge sur la ligne.
- Le virement bancaire lui-même reste manuel ; le déclenchement de remboursements Stripe depuis l'admin = itération dédiée.

### Console de clôture — fonctionnement

- L'edge function `close-drop` (v2) **persiste chaque run** dans `drop_close_runs` (rapport JSONB : captures/releases/erreurs, `triggered_by` cron|admin). Avant, le rapport était retourné au cron puis perdu.
- La relance manuelle (`relancerCloture`) ré-invoque l'edge function avec le service role (server action only). Idempotente : les bids déjà capturés/relâchés sont skip, seuls les échecs sont retentés. Stripe reste confiné à l'edge function.
- `get_cron_health()` (SECURITY DEFINER, admin only) lit `cron.job` + `cron.job_run_details` : dernier run, échecs 24h des 3 jobs.
- Les bids individuels (montants, état Stripe) ne s'affichent que **post-résolution** (revealed/cancelled) — hygiène sealed-bid, même en admin.

## Conventions (à respecter en continuant)

- **Next 14** : `createClient()` de `lib/supabase/server` est **synchrone** ; `params`/`searchParams` sont synchrones (pas de `Promise`/`await`).
- Formulaires : **`useFormState` + `useFormStatus`** (`react-dom`), pas `useActionState` (React 18).
- Server Actions pour toute mutation ; `export const dynamic = "force-dynamic"` sur les pages admin.
- Service role (`lib/supabase/service.ts`) **uniquement** côté serveur pour les invitations (création user/profil) — jamais en rendu user.
- Montants en cents partout. Accent champagne via `var(--champagne)`.
- Le **prix provisoire N-ième** ne s'affiche **que** dans `/admin` (opérateur). Côté `/maison` : agrégés seulement, montants masqués jusqu'au reveal (`get_maison_drop_metrics` applique ce gating + le contrôle d'accès en SQL).

## Migrations (db/migrations/) — déjà appliquées en live

| # | Objet |
|---|---|
| `0010_platform_admins` | table `platform_admins` + `is_platform_admin()` |
| `0011_platform_admin_policies` | policies admin sur drops/brands/brand_admins/transactions/deliveries/profiles/bids |
| `0012_maison_drop_metrics_fn` | `get_maison_drop_metrics()` (SECURITY DEFINER : accès + gating reveal) |
| `0013_client_overview_fn` | `get_client_overview()` (agrégés clients, admin only) |
| `0014_brands_strict_constraints` | CHECK : nom/slug/description/logo(format img https)/site(https)/pays ISO2 |
| `0015_support` | tables `support_tickets` + `support_messages`, RLS, trigger d'activité |
| `0016_fix_log_bid_change_digest` | **correctif bloquant** : `log_bid_change` appelait `digest()` hors search_path → toute insertion d'enchère échouait. Qualifié en `extensions.digest()`. ⚠️ La cause racine est dans `0002_harden_security` (à patcher aussi pour une base recréée from scratch). |
| `0021_close_console` | table `drop_close_runs` (RLS : SELECT admin, INSERT service role) + `get_cron_health()` (admin only) — console de clôture |
| `0022_drop_payouts` | table `drop_payouts` (journal des virements maisons, RLS admin ALL, UNIQUE drop_id) — écran Finance |
| `0023_plateforme` | `is_platform_owner()` + policy owner-manage sur `platform_admins` + trigger `protect_last_owner` + `get_bid_audit()` (montants gated au reveal) — page Plateforme |
| `0024_retractation` | tables `withdrawal_requests` (workflow 14j, RLS admin + lecture client) et `refund_runs` (journal refunds, INSERT service role) — remboursements |
| `0025_retours_logistique` | `deliveries.direction` outbound\|return + `insured_value_cents` + `notes`, UNIQUE (transaction_id, direction) — retours |
| `0026_privilege_001` | table `serial_offers` (FORCE RLS : SELECT destinataire + admin, jamais maison) + `transactions.serial_no` + fonctions `create/accept/decline/admin_expire/expire_serial_offers` + cron 10 min — Privilège № 001, voir `Privilege_001.md` |

> Régénérer les types après migration : via le MCP Supabase `generate_typescript_types` → écrire dans `lib/supabase/types.ts` (pas de script npm `types`). Le fichier a déjà été régénéré avec les nouvelles tables/fonctions.

Advisors sécurité : les WARN « SECURITY DEFINER executable by authenticated » sur `is_platform_admin` / `get_maison_drop_metrics` / `get_client_overview` / `decline_serial_offer` / `admin_expire_serial_offer` sont **voulus** (contrôle d'accès interne dans la fonction : `auth.uid()` ou `is_platform_admin()`). Pré-existants non liés : `pg_net` dans `public`, `drop_alerts`/`drop_notifications` sans policy (deny-all volontaire), leaked-password protection à activer.

## Données de démo (à nettoyer avant prod)

- 1 commande démo sur le drop **#0** (bid gagnant + transaction capturée).
- 1 ticket support démo.
- **10 enchérisseurs démo** (emails `@dropno.test`, `auth.users` + `profiles` + bids actives) sur le drop **#2** ouvert, pour visualiser le prix provisoire.

Nettoyage type :
```sql
delete from auth.users where email like 'demo+%@dropno.test'; -- cascade profiles/bids
delete from support_tickets where subject like 'Quand ma pièce%';
-- la transaction/bid démo du drop #0 : supprimer manuellement si besoin
```

## Avant prod — sécurité (bascule soft-launch, cible octobre 2026)

Décidé 2026-06-14. Le login admin passe à **OTP 6 chiffres comme unique voie, partout**. Le compte admin vit dans `platform_admins` (indépendant de la méthode de login) — garder un admin ≠ garder un mot de passe.

1. **Purger le mot de passe de tous les `platform_admins`** (levier garanti, par compte) :
   ```sql
   update auth.users u set encrypted_password = null
   from public.platform_admins pa where pa.user_id = u.id;
   -- vérif : has_password doit être false pour tous
   select u.email, (u.encrypted_password is not null and u.encrypted_password <> '') as has_password
   from auth.users u join public.platform_admins pa on pa.user_id = u.id;
   ```
   ⚠️ Casse l'accès `/dev-login` (preview local) — à faire **au cutover**, pas avant. Récupération possible via Dashboard Supabase (service role).
2. **Couper le provider password** côté projet (Dashboard → Authentication → Email) en gardant Magic Link / OTP. Activer **leaked password protection**.
3. **Vérifier `/dev-login` mort en prod** : `GET /dev-login` et `/fr/dev-login` → « Indisponible » (formulaire masqué par `NODE_ENV`). `/dev-login` rétrogradé en issue de secours documentée uniquement.
4. **Second facteur sur l'unique compte admin** (risque résiduel n°1 une fois le password coupé) : cible itsme/Signicat (login+KYC, déjà roadmap) ou passkey/MFA. Avant hard-launch, pas bloquant pour le soft-open gated.
5. **Nettoyage données démo** (cf. « Données de démo ») : 10 enchérisseurs `@dropno.test`, commande/bid démo drop #0, ticket démo — sinon ils polluent les agrégats `/admin` et le premier vrai clearing.

> L'architecture d'autorisation applicative est saine (middleware session + layout rôle + chaque server action gardée + RLS backstop ; les 7 fichiers d'actions vérifiés). Les risques réels sont en **config Supabase Auth** (provider password) et l'**absence de 2FA** sur le compte unique — d'où cette checklist.

## TODO / pistes

- ⚠️ **`STRIPE_SECRET_KEY` absente des secrets edge function** (constaté 2026-06-12 : un run réel de capture échouerait). À reposer : Dashboard → Edge Functions → Secrets, ou `supabase secrets set STRIPE_SECRET_KEY=sk_test_…`. Le snapshot CLAUDE.md la disait configurée — plus le cas.
- Patcher la cause racine du bug d'enchère dans `0002_harden_security` (en plus de `0016`).
- Bucket Supabase **Storage** pour les visuels (drops + logos maison) + upload, au lieu d'URLs.
- Édition de drops **côté maison** (`/maison`) — les contraintes DB encadrent déjà.
- Sélecteur de **date précise** dans le calendrier (en plus du décalage par pas).
- ~~Flux de **remboursement** Stripe~~ ✅ fait (0024 + edge function `refund-transaction`).
- **Portail support client** (les policies RLS clients existent déjà).
- Tests (Vitest/Playwright) sur les server actions admin + le gating maison.
