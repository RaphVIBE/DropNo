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
- Hosting : Netlify
- Analytics : PostHog
- Support : Crisp
- Email transactionnel : Resend

## Entité légale, domaine, email

- **Personne morale** : **Veracruz SRL** (exploitant la marque « Drop No. »)
- **Siège social** : Route de Huy 134, 4287 Lincent, Belgique
- **BCE** : BE 0799.209.229
- **Domaine** : `dropno.eu` (lock chez Combell, DNS pointe vers Google Workspace pour les MX)
- **Emails** : `raph@dropno.eu` (perso founder, boîte primaire), `hello@dropno.eu` (alias public, forward vers raph@)
- **DNS auth email** : SPF ✅ (`v=spf1 include:_spf.google.com ~all`), DKIM Google Workspace ✅ posé chez Combell et propagé au 2026-06-21 (`google._domainkey`, clé 2048 bits), DMARC ✅ en `p=none` (observation, à durcir plus tard). Reste : ajouter `amazonses.com` au SPF quand Resend sera branché pour le transactionnel. Baseline mail-tester avant fix : 0.7/10 au 2026-06-13.
- **Stripe Connect** : onboarding Veracruz SRL en cours, URLs publiques à pointer vers `dropno.eu/privacy-policy` et `dropno.eu/terms-of-service` (slugs anglais attendus par Stripe).

## Coordonnées Supabase (projet drop-no)

- Project ID : `ygzyzvjxregoqbzmcmyq`
- URL : `https://ygzyzvjxregoqbzmcmyq.supabase.co`
- Région : eu-west-3 (Paris)
- Publishable key : `sb_publishable_CCtEsFQO-3MxGwmIP-jjlg_dsJvjOKn`
- ⚠️ Service role key : récupérer Dashboard → Settings → API. Jamais committée.

## État backend (snapshot 2026-06-12)

| Composant | État |
|---|---|
| Schéma DB (RLS strict, FORCE RLS sur bids) | ✅ déployé (migrations 0001+) |
| Hardening sécurité (search_path, REVOKE RPC, deny-all audit_log) | ✅ déployé (0002) |
| Fonction SQL `close_drop()` atomique | ✅ déployée |
| Edge function `close-drop` (TS, Stripe capture/release) | ✅ déployée v2 ACTIVE (persiste les runs dans `drop_close_runs`) |
| Vault secrets (`edge_function_url`, `service_role_key`) | ✅ configurés |
| Cron `dispatch_ripe_drops` / `open_ripe_drops` / `dispatch_reminders` | ✅ actifs |
| Edge function secret `STRIPE_SECRET_KEY` | ⚠️ **probablement posée** (run de clôture du 2026-06-25 passe le garde-fou — plus de « not configured » → clé lue par close-drop). Le constat « ABSENTE » du 2026-06-12 est périmé. À confirmer définitivement via `supabase secrets list` (= L1 du ROADMAP) |
| **Back-office** (`/admin` opérateur + `/maison` responsables, thème dark) | ✅ intégré — voir `docs/specs/BACKOFFICE.md` |
| Rôle admin-plateforme (`platform_admins` + `is_platform_admin()`) | ✅ déployé (0010) |
| Policies admin + fonctions agrégées + support + contraintes maison | ✅ déployé (0011–0015) |
| ⚠️ Correctif bug `log_bid_change` (digest hors search_path → bids bloqués) | ✅ déployé (0016) ; cause racine à patcher aussi dans 0002 |
| **Console de clôture** (`/admin/cloture` : runs, santé crons, relance manuelle) | ✅ déployée (0021 + close-drop v2) — voir `docs/specs/BACKOFFICE.md` |
| **Finance / payouts maisons** (`/admin/finance` : dû par drop, rétractation, marquer payé) | ✅ déployée (0022) — voir `docs/specs/BACKOFFICE.md` |
| **Plateforme** (`/admin/plateforme` : équipe d'admins owners/staff + journal d'audit des enchères) | ✅ déployée (0023) — voir `docs/specs/BACKOFFICE.md` |
| **Rétractation & remboursements** (workflow 14j sur `/admin/commandes/[id]` + edge function `refund-transaction`) | ✅ déployée (0024) — dépend de `STRIPE_SECRET_KEY` (probablement posée, cf. L1 — à confirmer via `supabase secrets list`) |
| **Retours logistique** (trajet retour sur `deliveries` : direction, valeur assurée, tracking) | ✅ déployée (0025) — voir `docs/specs/BACKOFFICE.md` |
| **Privilège № 001** (`serial_offers` + close-drop v3 + refund-transaction v2 + `/account/offre/[id]` + cron `expire_serial_offers`) | ✅ déployé (0026) — voir `docs/specs/Privilege_001.md` ; paiement supplément dépend aussi de `STRIPE_SECRET_KEY` (probablement posée, cf. L1 — à confirmer via `supabase secrets list`) |
| **Vente partielle** (`drops.all_or_nothing` + close_drop v4 + toggle form création) | ✅ migration 0032 + front ; vente partielle par défaut, tout ou rien optionnel |
| **Analytics PostHog** (tracking vitrine snippet + event `drop_view` ; cadrans `/admin`, fiche drop, `/admin/audience`) | ✅ code en place — ⚠️ clés env à poser (`NEXT_PUBLIC_POSTHOG_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_PERSONAL_API_KEY`), voir `docs/specs/BACKOFFICE.md` |

Settings stockés dans Supabase Vault (pas ALTER DATABASE — postgres n'est pas superuser sur Supabase). Lookup via `vault.decrypted_secrets`, update via `vault.update_secret(<uuid>, ...)`.

## Décisions verrouillées (NE PAS re-questionner)

- **Mécanisme** : sealed-bid uniform price, **N-ième bid clearing** (pas Vickrey N+1)
- **Défaut gagnant** : capture Stripe échouée au reveal → clearing **figé** pour les autres gagnants, exemplaire **invendu** (re-list futur), **pas de cascade** au (N+1)-ième
- **Sous-souscription** (décidé 2026-06-16) : si moins de N offres ≥ plancher, **vente partielle par défaut** — les K offres gagnent et payent le clearing (la plus basse gagnante, K-ième bid), les N−K exemplaires restent à la maison. Flag **`drops.all_or_nothing`** (réglé à la création) bascule en **annulation** tant que K < N. Annulation aussi si zéro offre ≥ plancher. Voir migration 0032 (close_drop v4)
- **Marketplace** : brand-direct only B2C, pas de C2C revente
- **Authentification** : certificat marque suffit (vendeur = marque)
- **KYC acheteur** : Stripe Identity au 1er bid (light, dès 1€ pour respecter AML EU sur luxe)
- **Rétractation** : 14j EU standard, remboursement intégral (pas restocking fee)
- **Frais** : vendeur 12% + 5€ fixes, acheteur 0%
- **Prix plancher MVP** : 3 000€
- **Logistique tier** : DHL Express assuré (3-10k€) / Malca-Amit concierge main propre (>10k€)
- **Cadence** (décidé 2026-06-12) : 1 drop/semaine, révélation le **jeudi 18h CET/CEST** (Europe/Brussels). Le rituel est ancré dans la copy du site.
- **Catégorie MVP** : montres uniquement (bijoux/vêtements/art = v2)
- **Brand naming** : Drop No. (Drop № 001, 002…)
- **Privilège № 001** (décidé 2026-06-12) : offre privée post-reveal au seul bid le plus haut pour réserver le numéro de série 001. Supplément = 50% du spread (bid − clearing), plancher 5% du clearing. Paiement on-session séparé (une PaymentIntent = une seule capture). Pas de cascade au rang 2, pas d'annonce pré-bid, validité 24h. Rangs 2-5 = v2. Voir `docs/specs/Privilege_001.md` — ✅ **implémenté et déployé** (0026 + close-drop v3 + refund-transaction v2 + écran client + admin + tests)

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
- **Back-office** (`/admin`, `/maison`) : Next 14 → `createClient()` **synchrone**, `params`/`searchParams` synchrones ; formulaires en **`useFormState`/`useFormStatus`** (pas `useActionState`) ; thème **dark** via le scope `.admin` dans `globals.css` (ne pas dupliquer les tokens). Détails dans `docs/specs/BACKOFFICE.md`.
- **Prix provisoire N-ième** (clôture en cours) : affiché **uniquement** dans `/admin`. Côté maison/client : agrégés masqués jusqu'au reveal.

## Fichiers à lire avant de coder

1. `docs/specs/PRD_v2_DropNo.md` — source de vérité produit
2. `docs/specs/Decisions_Mecanisme.md` — pourquoi sealed-bid plutôt qu'English ouvert
3. `db/schema-design.md` — narratif schéma
4. `db/security-review.md` — modèle de menace + walkthrough attaques
5. `supabase/README.md` — architecture backend + déploiement
6. `docs/design/design-system/tokens.css` + `docs/design/design-system/components.md` — source of truth design
7. `docs/design/mockups/dropno-mockups.html` — rendu visuel des 3 écrans produit
8. `docs/design/mockups/dropno-homepage-public.html` — homepage publique dropno.eu (manifeste + calendar + lire + newsletter)
9. `docs/design/mockups/reveal-hero.html` — moment de révélation à T (bascule dark, clip-path reveal du clearing price)
10. `content/legal/` — drafts CGU, CGV, Privacy, Cookies, Mentions, Rétractation (à valider juriste avant publication)
11. `content/essays/` — essais éditoriaux pour `/lire` (Vickrey/Trésor publié, autres à paraître)
12. `business/prospection/` — emails de prospection marques (Ressence, Furlan Marri), `pipeline.xlsx`
13. `business/pitch/` — pitch decks maisons (`presentation-maisons.fr/.en.pptx`, PDF, captures dans `assets/`)
14. `docs/specs/BACKOFFICE.md` — **back-office `/admin` + `/maison`** : architecture, surfaces, conventions, migrations 0010–0016, accès dev, données démo
15. `docs/specs/Privilege_001.md` — spec du Privilège № 001 (offre série 001 au top bidder)

## Design tokens (depuis le mockup)

- Background : `oklch(0.975 0.006 80)` (off-white warm-tinted)
- Ink : `oklch(0.18 0.012 60)` (deep brown-black)
- Champagne accent : `oklch(0.72 0.07 80)` (parcimonieux)
- Display serif : Fraunces italic 300
- Body sans : Inter
- Light theme only au MVP
- Mobile-first : 80% du trafic attendu mobile

## Open decisions encore à trancher avec l'owner

- Politique bids retirés entre T-24h et T-1h (interdire ou pénaliser ?)
- Variante Vickrey : reconsidérer post-launch si évidence de bidding non-sincère
- Régime TVA fees marque : à valider expert-comptable
- Teinte champagne exacte (à valider en maquettes finales)
- Privilège № 001 : extension aux rangs 2-5 (choix du numéro parmi 002-005) = v2, à réévaluer post-launch

## Workflow recommandé

1. Lire `CLAUDE.md` (ce fichier) + `docs/specs/PRD_v2_DropNo.md`
2. Si scaffolding from scratch : prompt « Scaffold Next.js 14 App Router + Tailwind + shadcn + Supabase client + Stripe pour Drop No., suivant les conventions de CLAUDE.md »
3. Itérer écran par écran. Priorité MVP : Drop Calendar → Page Drop → Auth/KYC flow → Dashboard utilisateur
4. Toujours valider RLS sur chaque nouvelle requête (test avec un user authentifié sans KYC ne doit jamais voir un bid d'autrui)
5. Commit fréquents en FR, branches par feature
