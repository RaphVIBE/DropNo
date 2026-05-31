# Passage à Claude Code — guide opérationnel

## 1. Installation Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Doc : https://docs.claude.com/en/docs/claude-code/overview

## 2. Préparation du repo

Dans un terminal, depuis le dossier projet :

```bash
cd "/Users/raphael/Documents/Claude/Projects/FlashSales"

# Init git si pas déjà fait
git init
git add .
git commit -m "chore: foundations Drop No. — PRD v2, schéma DB, mockups, edge function"

# Setup .env.local depuis le template
cp .env.local.example .env.local
# Puis ouvrir .env.local et remplir SUPABASE_SERVICE_ROLE_KEY + clés Stripe

# Ajouter .env.local au gitignore
echo ".env.local" >> .gitignore
echo "node_modules/" >> .gitignore
echo ".next/" >> .gitignore
git add .gitignore
git commit -m "chore: gitignore env + node_modules"
```

## 3. Lancer Claude Code

```bash
claude
```

Claude Code va lire `CLAUDE.md` automatiquement et avoir tout le contexte produit + backend.

## 4. Premiers prompts recommandés (dans l'ordre)

### Prompt 1 — Scaffold

> Lis CLAUDE.md et PRD_v2_DropNo.md. Scaffold un projet Next.js 14 App Router avec TypeScript strict, Tailwind, shadcn/ui, le client Supabase (browser + server avec @supabase/ssr), et la lib Stripe. Suis les conventions de CLAUDE.md. Setup auth Supabase basique (sign in avec magic link email). Crée la structure de dossiers :
> ```
> app/(public)/(home|drops|drop/[id])
> app/(auth)/(login|callback)
> app/(account)/dashboard
> app/api/stripe/(webhook|create-payment-intent)
> lib/supabase/(browser|server|service)
> lib/stripe/client.ts
> components/ui/        # shadcn
> components/drop/      # composants métier
> ```
> Setup le middleware Supabase pour les routes protégées. Génère les types TS depuis Supabase avec `npx supabase gen types` (project ID dans CLAUDE.md). Lance `npm run build` à la fin pour valider.

### Prompt 2 — Drop Calendar (premier écran)

> Implémente le Drop Calendar (route `/drops`) en suivant le mockup `mockups/dropno-mockups.html` section calendrier. Layout en 3 sections : En cours, À venir, Passés. Fetch depuis la vue `drops_public` Supabase (RLS-safe). Affiche compte à rebours live pour les drops en cours/à venir. Style avec les tokens design dans CLAUDE.md. Mobile-first.

### Prompt 3 — Page Drop (cœur produit)

> Implémente la page Drop (route `/drop/[id]`) en suivant le mockup. Composants à créer :
> - DropHero (titre, marque, hero image, status dot animé)
> - DropCountdown (live, ticking seconde, sync serveur)
> - DropSpecs (prix plancher, exemplaires, nb bids)
> - DropBidForm (input sealed bid, validation client : ≥ floor, intégration Stripe PaymentIntent en mode `manual_capture`)
> - DropDetail (story marque, specs techniques)
>
> Validation côté serveur via RLS Supabase. Si user pas authentifié → CTA login. Si user authentifié sans KYC → trigger flow Stripe Identity. Si user a déjà un bid → afficher montant + bouton modifier.

### Prompt 4 — Auth + KYC flow

> Implémente le flow d'authentification + KYC :
> - Login : magic link Supabase (route `/login`)
> - Callback : route `/auth/callback`, crée la row `profiles` en upsert si nouveau user
> - KYC : composant `KYCGate` qui détecte `profiles.kyc_status != 'verified'`, ouvre une session Stripe Identity Verification, redirige sur le site Stripe, retour via webhook qui update `profiles.kyc_status = 'verified'`
> - Webhook Stripe Identity : route `/api/stripe/webhook` qui handle `identity.verification_session.verified`
>
> Tester chaque étape avec un user de test.

### Prompt 5 — Dashboard utilisateur

> Crée `/account/dashboard` avec 3 sections : Mes bids (en cours / passés), Mes gains (transactions status=captured), Mes livraisons (deliveries). Chaque section liste depuis Supabase avec RLS (le user ne voit que les siennes). Lien vers `/drop/[id]` depuis chaque ligne.

## 5. Reprendre les sujets ouverts

Une fois le MVP code en place :

- Appliquer migration `0003_scheduler.sql` après config des settings DB (`ALTER DATABASE postgres SET app.settings.service_role_key = '...'`)
- Configurer `supabase secrets set STRIPE_SECRET_KEY=...`
- Tester un drop end-to-end en staging (créer une marque, un drop avec reveal_at à T+5min, soumettre 3 bids de test, attendre la clôture)
- Implémenter le webhook Stripe Identity pour KYC auto
- Ajouter Resend pour les emails de notification (ouverture, J-1, H-1, résultat)
- Setup PostHog côté front + côté Supabase events
- Ajouter Crisp widget

## 6. Si tu veux continuer en Cowork pour certains sujets

Cowork reste utile pour :

- Itérer sur les mockups visuels (impeccable skill)
- Réviser le PRD ou les décisions business
- Appliquer des migrations Supabase via MCP
- Discussions stratégiques (acquisition, juridique, marques cibles)
- Génération de documents (.docx pitch, contrat-cadre)

Tu peux switcher entre les deux librement : Claude Code pour le code itératif, Cowork pour la discovery / strategy / docs.

## 7. État courant des fichiers du projet

```
FlashSales/
├── CLAUDE.md                          # contexte Claude Code
├── NEXT_STEPS.md                      # ce fichier
├── .env.local.example
├── PRD_v2_DropNo.md                   # PRD v2 source de vérité
├── PRD_Critique.md                    # audit du PRD initial
├── Decisions_Mecanisme.md             # choix sealed-bid vs english
├── Decisions_Mecanisme.md
├── Mecanisme_Enchere.md               # taxonomie + diagnostic
├── mockups/
│   └── dropno-mockups.html            # 3 écrans interactifs
├── db/
│   ├── schema-design.md
│   ├── security-review.md
│   └── migrations/
│       ├── 0001_init_drop_no.sql      # ✅ appliquée
│       ├── 0002_harden_security.sql   # ✅ appliquée
│       └── 0003_scheduler.sql         # ⏳ en attente
└── supabase/
    ├── README.md
    └── functions/
        └── close-drop/
            ├── index.ts               # ✅ déployée v1
            └── deno.json
```
