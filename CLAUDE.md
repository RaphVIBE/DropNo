# Drop No. — Claude Code context

Project : **Drop No.**, plateforme de drops scellés multi-gagnants pour montres premium brand-direct.
Owner : Raphaël Hombroeck (raph@veracruz.be).
Langue : français (code, doc, commits OK en FR).

## Pitch en 1 paragraphe

Une marque ouvre un drop hebdo : N exemplaires d'une pièce, prix plancher P, fenêtre de bids de 5 jours. Les acheteurs soumettent une offre cachée (sealed bid), modifiable jusqu'à T-1h. À T (révélation), le système trie les bids ; les N plus hautes ≥ P gagnent ; **tous payent le même prix : le N-ième bid** (uniform price clearing). Pas de surenchère temps réel, pas de guerre des prix. Inspirations : Supreme drops, AP, Christie's sealed sales.

## Stack

- Frontend : Next.js 14 (App Router) + Tailwind + shadcn/ui
- Backend : Supabase (Postgres 17, Auth, RLS, Edge Functions Deno)
- Paiement : Stripe (PaymentIntents pre-auth + Stripe Identity KYC)
- Hosting : Vercel
- Analytics : PostHog
- Support : Crisp
- Email transactionnel : Resend

## Coordonnées Supabase (projet drop-no)

- Project ID : `ygzyzvjxregoqbzmcmyq`
- URL : `https://ygzyzvjxregoqbzmcmyq.supabase.co`
- Région : eu-west-3 (Paris)
- Publishable key : `sb_publishable_CCtEsFQO-3MxGwmIP-jjlg_dsJvjOKn`
- ⚠️ Service role key : récupérer Dashboard → Settings → API. Jamais committée.

## État backend (snapshot 2026-06-09)

| Composant | État |
|---|---|
| Schéma DB (RLS strict, FORCE RLS sur bids) | ✅ déployé (migrations 0001+) |
| Hardening sécurité (search_path, REVOKE RPC, deny-all audit_log) | ✅ déployé (0002) |
| Fonction SQL `close_drop()` atomique | ✅ déployée |
| Edge function `close-drop` (TS, Stripe capture/release) | ✅ déployée v1 ACTIVE |
| Vault secrets (`edge_function_url`, `service_role_key`) | ✅ configurés |
| Cron `dispatch_ripe_drops` / `open_ripe_drops` / `dispatch_reminders` | ✅ actifs |
| Edge function secret `STRIPE_SECRET_KEY` | ✅ configuré (mode test) |
| **Back-office** (`/admin` opérateur + `/maison` responsables, thème dark) | ✅ intégré — voir `BACKOFFICE.md` |
| Rôle admin-plateforme (`platform_admins` + `is_platform_admin()`) | ✅ déployé (0010) |
| Policies admin + fonctions agrégées + support + contraintes maison | ✅ déployé (0011–0015) |
| ⚠️ Correctif bug `log_bid_change` (digest hors search_path → bids bloqués) | ✅ déployé (0016) ; cause racine à patcher aussi dans 0002 |

Settings stockés dans Supabase Vault (pas ALTER DATABASE — postgres n'est pas superuser sur Supabase). Lookup via `vault.decrypted_secrets`, update via `vault.update_secret(<uuid>, ...)`.

## Décisions verrouillées (NE PAS re-questionner)

- **Mécanisme** : sealed-bid uniform price, **N-ième bid clearing** (pas Vickrey N+1)
- **Marketplace** : brand-direct only B2C, pas de C2C revente
- **Authentification** : certificat marque suffit (vendeur = marque)
- **KYC acheteur** : Stripe Identity au 1er bid (light, dès 1€ pour respecter AML EU sur luxe)
- **Rétractation** : 14j EU standard, remboursement intégral (pas restocking fee)
- **Frais** : vendeur 12% + 5€ fixes, acheteur 0%
- **Prix plancher MVP** : 3 000€
- **Logistique tier** : DHL Express assuré (3-10k€) / Malca-Amit concierge main propre (>10k€)
- **Cadence** : 1 drop/semaine, jour fixe (reco jeudi 18h CET, à confirmer)
- **Catégorie MVP** : montres uniquement (bijoux/vêtements/art = v2)
- **Brand naming** : Drop No. (Drop № 001, 002…)

## Out-of-scope MVP (différé v2+)

C2C revente, app native, NFT/blockchain, multi-catégories, programme premium tier, API publique, multi-langues (FR+EN only), paiement crypto, programme parrainage, live shows.

## Conventions de code

- **Montants** : toujours en cents (BIGINT côté DB, number côté TS). Jamais de float.
- **TVA** : 20% par défaut, à valider expert-comptable.
- **Em dashes** : interdits dans la copy utilisateur (style guide brand). Code : peu importe.
- **Migrations Supabase** : numérotées séquentiellement dans `db/migrations/NNNN_description.sql`.
- **RLS** : sacrée. Le client n'utilise JAMAIS service_role. Vérifier RLS sur chaque nouvelle table.
- **Tests** : Vitest unit, Playwright e2e.
- **Dates** : tout en UTC côté DB, conversion vers Europe/Paris côté UI.
- **Back-office** (`/admin`, `/maison`) : Next 14 → `createClient()` **synchrone**, `params`/`searchParams` synchrones ; formulaires en **`useFormState`/`useFormStatus`** (pas `useActionState`) ; thème **dark** via le scope `.admin` dans `globals.css` (ne pas dupliquer les tokens). Détails dans `BACKOFFICE.md`.
- **Prix provisoire N-ième** (clôture en cours) : affiché **uniquement** dans `/admin`. Côté maison/client : agrégés masqués jusqu'au reveal.

## Fichiers à lire avant de coder

1. `PRD_v2_DropNo.md` — source de vérité produit
2. `Decisions_Mecanisme.md` — pourquoi sealed-bid plutôt qu'English ouvert
3. `db/schema-design.md` — narratif schéma
4. `db/security-review.md` — modèle de menace + walkthrough attaques
5. `supabase/README.md` — architecture backend + déploiement
6. `mockups/dropno-mockups.html` — rendu visuel des 3 écrans clés
7. `BACKOFFICE.md` — **back-office `/admin` + `/maison`** : architecture, surfaces, conventions, migrations 0010–0016, accès dev, données démo

## Design tokens (depuis le mockup)

- Background : `oklch(0.975 0.006 80)` (off-white warm-tinted)
- Ink : `oklch(0.18 0.012 60)` (deep brown-black)
- Champagne accent : `oklch(0.72 0.07 80)` (parcimonieux)
- Display serif : Fraunces italic 300
- Body sans : Inter
- Light theme only au MVP
- Mobile-first : 80% du trafic attendu mobile

## Open decisions encore à trancher avec l'owner

- Jour exact du drop hebdo (reco jeudi 18h CET)
- Politique bids retirés entre T-24h et T-1h (interdire ou pénaliser ?)
- Variante Vickrey : reconsidérer post-launch si évidence de bidding non-sincère
- Régime TVA fees marque : à valider expert-comptable
- Teinte champagne exacte (à valider en maquettes finales)

## Workflow recommandé

1. Lire `CLAUDE.md` (ce fichier) + `PRD_v2_DropNo.md`
2. Si scaffolding from scratch : prompt « Scaffold Next.js 14 App Router + Tailwind + shadcn + Supabase client + Stripe pour Drop No., suivant les conventions de CLAUDE.md »
3. Itérer écran par écran. Priorité MVP : Drop Calendar → Page Drop → Auth/KYC flow → Dashboard utilisateur
4. Toujours valider RLS sur chaque nouvelle requête (test avec un user authentifié sans KYC ne doit jamais voir un bid d'autrui)
5. Commit fréquents en FR, branches par feature
