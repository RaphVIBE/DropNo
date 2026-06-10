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
| Produits / Drops | `app/admin/produits/{page,new,[id],actions,DropForm}` | CRUD + planning des fenêtres ; garde-fous par statut |
| Commandes & livraisons | `app/admin/commandes/{page,[id],actions}` | paiement + fulfillment (DHL/Malca-Amit/Brink's), workflow de statut |
| Clients & comptes | `app/admin/clients/{page,[id]}` | visibilité KYC + activité (lecture seule) |
| Maisons & invitations | `app/admin/maisons/{page,new,[id],actions,MaisonForm}` | fiche verrouillée (compteurs) + invitations email (service role) |
| Support | `app/admin/support/{page,new,[id],actions}` | tickets + fil de messages + notes internes, statut/priorité/assignation |
| Dashboard maison | `app/maison/{layout,page}` | vue responsables via `get_maison_drop_metrics` (agrégés, gating reveal) |

Domaines (labels, validations, transitions) : `lib/admin/{drops,orders,clients,maisons,support,format}.ts`.

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

> Régénérer les types après migration : via le MCP Supabase `generate_typescript_types` → écrire dans `lib/supabase/types.ts` (pas de script npm `types`). Le fichier a déjà été régénéré avec les nouvelles tables/fonctions.

Advisors sécurité : les WARN « SECURITY DEFINER executable by authenticated » sur `is_platform_admin` / `get_maison_drop_metrics` / `get_client_overview` sont **voulus** (contrôle d'accès interne dans la fonction). Pré-existants non liés : `pg_net` dans `public`, `drop_alerts`/`drop_notifications` sans policy (deny-all volontaire), leaked-password protection à activer.

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

## TODO / pistes

- Patcher la cause racine du bug d'enchère dans `0002_harden_security` (en plus de `0016`).
- Bucket Supabase **Storage** pour les visuels (drops + logos maison) + upload, au lieu d'URLs.
- Édition de drops **côté maison** (`/maison`) — les contraintes DB encadrent déjà.
- Sélecteur de **date précise** dans le calendrier (en plus du décalage par pas).
- Flux de **remboursement** Stripe (laissé manuel par sécurité).
- **Portail support client** (les policies RLS clients existent déjà).
- Tests (Vitest/Playwright) sur les server actions admin + le gating maison.
