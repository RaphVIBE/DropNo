# Drop No.

Plateforme de **drops scellés multi-gagnants** pour montres premium, en
brand-direct. Une marque ouvre un drop hebdomadaire : N exemplaires d'une pièce,
prix plancher P, fenêtre de bids de 5 jours. Les acheteurs soumettent une offre
cachée (sealed bid), modifiable jusqu'à T-1h. À la révélation, les N plus hautes
offres ≥ P gagnent et **toutes payent le même prix : le N-ième bid** (uniform
price clearing). Pas de surenchère temps réel, pas de guerre des prix.

## Stack

- **Frontend** : Next.js 14 (App Router, TypeScript strict) + Tailwind + shadcn/ui
- **Backend** : Supabase (Postgres 17, Auth, RLS stricte, Edge Functions Deno)
- **Paiement** : Stripe (PaymentIntents pré-auth capture manuelle + Stripe Identity KYC)
- **Hosting** : Vercel · **Emails** : Resend · **Analytics** : PostHog · **Support** : Crisp

## Démarrage

```bash
npm install
cp .env.local.example .env.local   # puis remplir les clés (Supabase service role, Stripe)
npm run dev                         # http://localhost:3000
```

`.env.local` n'est jamais committé. Voir `.env.local.example` pour les variables.

## Structure

```
app/
  (public)/         # home, /drops (calendrier), /drop/[id]
  (auth)/           # /login, /auth/callback
  account/dashboard # mes offres / gains / livraisons
  api/              # bids, stripe (webhook, identity-session, payment-intent)
components/
  drop/ kyc/ account/ ui/
lib/
  supabase/ (browser|server|service)  stripe/  format.ts
db/migrations/      # 0001 init, 0002 hardening, 0003 scheduler, 0004 vault
supabase/functions/close-drop/        # clôture atomique (capture/release Stripe)
```

## Mécanisme

Sealed-bid uniform price, **clearing au N-ième bid** (pas Vickrey N+1). Tri des
bids à la révélation par `close_drop()` (SQL atomique, idempotente,
`SECURITY DEFINER`), puis capture/libération Stripe via l'edge function
`close-drop`. Un cron `dispatch_ripe_drops` (pg_cron) déclenche la clôture à T.

## Documentation

- `PRD_v2_DropNo.md` — source de vérité produit
- `Decisions_Mecanisme.md` — pourquoi sealed-bid
- `db/schema-design.md` · `db/security-review.md` — schéma & modèle de menace
- `supabase/README.md` — architecture backend & déploiement
- `CLAUDE.md` — contexte & conventions

## Sécurité

RLS stricte : un acheteur ne voit que ses propres bids, jamais ceux d'autrui ni
ceux d'une marque — laquelle ne voit qu'un compteur agrégé jusqu'à la
révélation. Audit log append-only avec hash chain. Le client n'utilise jamais le
service role. Montants toujours en cents (jamais de float).
