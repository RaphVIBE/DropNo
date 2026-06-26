# Drop No. — Inventaire & plan de build

> Snapshot au 2026-06-01. Build `npm run build` ✅ vert (9 routes). Types Supabase régénérés (migration 0003 incluse : `dispatch_ripe_drops`).

## 1. Inventaire des pages / routes

### Pages front — FAITES

| Route | Fichier | État | Notes |
|---|---|---|---|
| `/` | `app/(public)/page.tsx` | ✅ complet | Landing, CTA calendrier + login |
| `/drops` | `app/(public)/drops/page.tsx` | ✅ complet | 3 sections (En cours / À venir / Passés), vue `drops_public` RLS-safe, countdown serveur-sync |
| `/drop/[id]` | `app/(public)/drop/[id]/page.tsx` | ✅ complet (1 réserve) | Hero, art, specs, countdown, bid form, detail. **Réserve : pas de collecte carte** (voir §2) |
| `/login` | `app/login/page.tsx` | ✅ complet | Magic link Supabase + `?redirect=` |
| `/auth/callback` | `app/auth/callback/route.ts` | ✅ complet | Échange code → session, upsert `profiles` idempotent |
| `/account/dashboard` | `app/account/dashboard/page.tsx` | ✅ complet | 3 sections : Mes bids / Mes gains (transactions) / Mes livraisons, RLS |

### API routes — FAITES

| Route | État | Notes |
|---|---|---|
| `POST /api/bids` | ✅ quasi-complet | Création/modif offre, PaymentIntent capture manuelle, email confirmation. **Manque : confirmation carte** (PI reste `requires_payment_method`) |
| `POST /api/stripe/identity-session` | ✅ complet | Session Stripe Identity (KYC US-26) |
| `POST /api/stripe/webhook` | 🟡 partiel | Events Identity branchés (verified/processing/requires_input/canceled). **Events `payment_intent.*` = TODO** |
| `POST /api/notifications/reminders` | ✅ complet (à câbler) | Rappels J-1 / H-1, secret partagé. Dépend du cron `dispatch_reminders` + fn SQL `reminders_due()` |
| `POST /api/notifications/drop-results` | ✅ complet (à câbler) | Emails résultat gagné/perdu, appelé par `close-drop` |
| `POST /api/stripe/create-payment-intent` | ⚠️ scaffold mort | Doublon non utilisé (la logique réelle vit dans `/api/bids`). À supprimer ou réutiliser pour le flow Elements |

### Composants — FAITS

`ui/button`, `site-nav`, `drop/{drop-hero, drop-art, drop-specs, drop-detail, drop-bid-form, drop-countdown, calendar-row}`, `kyc/start-kyc-button`, `account/account-section`.

### Librairie — FAITE

`supabase/{browser,server,service,middleware,types}`, `stripe/{client,browser}`, `email/{client,send,templates}`, `format`, `utils`. Middleware racine actif.

---

### NON FAITES / manquantes (vs PRD MVP)

| # | Manque | Story PRD | Criticité |
|---|---|---|---|
| A | **Collecte + confirmation carte (Stripe Elements)** — sans elle la pré-auth n'est jamais autorisée, le mécanisme ne tient pas | US-05 §3 | 🔴 Bloquant |
| B | **Animation de révélation** (chiffres qui défilent, prix unitaire) — mockup `reveal-hero.html` existe, pas de composant React | US-21 | 🟠 Haut |
| C | **Retrait d'offre** (UPDATE status=withdrawn jusqu'à T-24h) — RLS/trigger prêts, pas d'UI | PRD §3 | 🟠 Haut |
| D | **Back-office marque** (création drop, compteur bids agrégé) — aucune route | US-25, US-28 | 🟠 Haut (closed beta) |
| E | **Pages légales** CGV + rétractation 14j liées depuis chaque drop | US-29 | 🟠 Haut (juridique) |
| F | **Suivre un drop** (UI follow/unfollow) — table `drop_follows` + RLS prêtes | US-24 | 🟡 Moyen |
| G | **Logout + réglages compte** (newsletter opt-out) | — | 🟡 Moyen |
| H | **Câblage notifications** : crons pg_cron + secret `NOTIFY_SECRET` + vérif fn SQL `reminders_due()` / colonnes `drop_notifications` | US-22 | 🟡 Moyen |
| I | **Synchro webhook PaymentIntent** → `bids.stripe_auth_status` (lié à A) | R3 | 🟡 Moyen |
| J | **Tests** Vitest (clearing price, validations) + Playwright (bid e2e) | NFR | 🟡 Moyen |

---

## 2. Le point dur : le flow de paiement

Aujourd'hui `/api/bids` crée bien un PaymentIntent `capture_method: manual`, mais **aucune carte n'est jamais attachée ni confirmée**. Conséquence : le PI reste `requires_payment_method`, donc la pré-autorisation n'existe pas réellement — à la clôture `close_drop` n'aurait rien à capturer. C'est le maillon manquant n°1 du cœur produit.

**Flow cible :**
1. `/api/bids` crée le PI manuel → renvoie `client_secret` au client (au lieu d'un simple `ok`).
2. Le `DropBidForm` monte Stripe Elements (Payment Element), `stripe.confirmPayment` → carte autorisée (`requires_capture`).
3. Webhook `payment_intent.amount_capturable_updated` → met `bids.stripe_auth_status = 'authorized'`.
4. À la modification : annuler l'ancien PI (déjà fait) puis re-confirmer le nouveau.
5. `close-drop` capture les gagnants / annule les perdants (déjà implémenté côté edge function).

---

## 3. Plan de build proposé (ordonné par dépendance)

### Phase 1 — Boucler le cœur transactionnel 🔴
- **P1.1** ✅ FAIT — Stripe Elements (Payment Element) dans `DropBidForm`, flow 2 étapes (montant → carte → scellé). `/api/bids` crée un Stripe Customer (carte réutilisable via `setup_future_usage`), un PaymentIntent `capture_method:manual` et renvoie `client_secret`. Fallback sans clé Stripe préservé. Installé `@stripe/react-stripe-js@6`. **Bug latent corrigé** : `stripe_auth_status = pi.status` violait la contrainte CHECK → ajout du mapper `mapPaymentIntentStatus`.
- **P1.2** ✅ FAIT — Webhook : `payment_intent.amount_capturable_updated` → `authorized` + email de confirmation (idempotent via `.neq('authorized')`), `canceled` → `released`, `payment_failed` → `failed`. Email déplacé du POST /api/bids vers le webhook (envoyé quand la carte est réellement autorisée).
- **P1.3** ✅ FAIT — `/api/stripe/create-payment-intent` (doublon mort) supprimé.
- **P1.2b** ⏳ À FAIRE — CRITIQUE : `close_drop()` ne filtre que `status='active'` ; une offre dont la carte n'a jamais été autorisée (abandon à l'étape carte) reste `active`+`pending` et pourrait gagner → capture impossible. Fix : migration ajoutant `AND stripe_auth_status = 'authorized'` à la sélection des gagnants dans `close_drop`, + (option) cron qui invalide les offres restées `pending` à T-1h.
- **P1.4** ⏳ À FAIRE — Test e2e du flow complet sur staging (clés Stripe test requises ; non testable en local, clés vides). reveal_at = T+5min, 3 bids, clôture.

### Phase 2 — Compléter l'expérience acheteur 🟠
- **P2.1** Composant révélation animé (`/drop/[id]` à `status=revealed`) depuis `reveal-hero.html`. (B)
- **P2.2** Retrait d'offre dans `DropBidForm` (bouton « Retirer », visible si `now < reveal_at - 24h`). (C)
- **P2.3** Pages `/cgv` + `/retractation`, lien dans le footer + page drop. (E)
- **P2.4** Logout + opt-out newsletter dans le dashboard. (G)
- **P2.5** Bouton suivre/ne plus suivre sur `/drop/[id]` et `/drops`. (F)

### Phase 3 — Côté marque + notifications 🟠🟡
- **P3.1** Back-office marque : `/brand/drops` (liste + compteur agrégé) et `/brand/drops/new` (création drop, RLS `brand_admins`). (D)
- **P3.2** Vérifier/poser les crons notifications (`reminders`, déclenchement `drop-results` par `close-drop`), config `NOTIFY_SECRET`. (H)
- **P3.3** Onboarding marque (formulaire qualifié) — peut rester manuel au début. (US-28)

### Phase 4 — Qualité & durcissement 🟡
- **P4.1** Tests Vitest : clearing price N-ième, tie-break timestamp, validations bid. (J)
- **P4.2** Playwright : parcours login → KYC (mock) → bid → modif → retrait.
- **P4.3** Re-passe RLS : un user non-KYC ne voit jamais le bid d'autrui (test ciblé).
- **P4.4** Sentry + PostHog + Crisp (NFR observabilité).

### Pré-requis transverses à confirmer
- Aligner DB ↔ code : `dispatch_ripe_drops` est dans les types (0003 appliquée), mais NEXT_STEPS.md / CLAUDE.md la disent « en attente ». Confirmer l'état réel et MAJ la doc. Idem fonctions notifications (`reminders_due`, table `drop_notifications`, colonne `drops.result_notified_at`) référencées par le code — vérifier qu'une migration les pose.
- Renseigner `.env.local` : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NOTIFY_SECRET`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
