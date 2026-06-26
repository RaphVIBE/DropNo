# Runbook lancement — infra (L1, L3, L4, L6)

> Diagnostic Ops au 2026-06-26. Vérifié contre le code, la DB et les MCP Supabase.
> Source canonique de l'env : `.env.local.example` (plus complète que `docs/archive/LANCEMENT.md` §1.2).
> Ne mute rien en prod : ce sont des actions dashboard (Stripe / Netlify / Supabase) à faire par Raph.

## L1 — STRIPE_SECRET_KEY (edge functions)

**État : très probablement POSÉE sur close-drop.** Le run de clôture le plus récent
(`drop_close_runs` id 6, 2026-06-25) ne renvoie plus `STRIPE_SECRET_KEY not configured`
mais `No such payment_intent` (PI de test périmé) — donc la clé est lue et un appel Stripe réel
part. Les runs de 2026-06-12 (id 1, 2, 4) avaient le fatal « not configured ».

Requise par :
- `supabase/functions/close-drop/index.ts` (capture/release au reveal) — lazy init.
- `supabase/functions/refund-transaction/index.ts` (refunds/rétractation) — même pattern.

Les secrets edge function ne sont PAS lisibles via MCP. Vérifier en CLI :

    supabase secrets list --project-ref ygzyzvjxregoqbzmcmyq

Doit lister `STRIPE_SECRET_KEY` (+ `NOTIFY_SECRET`, `APP_URL` pour close-drop). Si absent :

    supabase secrets set STRIPE_SECRET_KEY=sk_live_... --project-ref ygzyzvjxregoqbzmcmyq
    supabase functions deploy close-drop refund-transaction --project-ref ygzyzvjxregoqbzmcmyq

Note : `STRIPE_SECRET_KEY` doit aussi exister côté Netlify (L3) pour `/api/stripe/*` (PI, identity).
Ce sont deux endroits distincts.

## L3 — Variables d'env Netlify

Liste exacte des `process.env.*` réellement consommés (grep app/ + lib/), croisée avec `.env.local.example` :

| Nom | Valeur / source | Build-time public ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ygzyzvjxregoqbzmcmyq.supabase.co` | oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_CCtEsFQO-3MxGwmIP-jjlg_dsJvjOKn` | oui |
| `SUPABASE_SERVICE_ROLE_KEY` | secret — Supabase > Settings > API > service_role | non |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_...` — Stripe > API keys | oui |
| `STRIPE_SECRET_KEY` | `sk_...` — Stripe > API keys | non |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` — créé à l'étape L4 | non |
| `RESEND_API_KEY` | secret — Resend | non |
| `RESEND_FROM_EMAIL` | `hello@dropno.eu` | non |
| `NOTIFY_SECRET` | même valeur que le secret edge function / Vault `notify_secret` | non |
| `NEXT_PUBLIC_APP_URL` | `https://dropno.netlify.app` (ou domaine custom) | oui |
| `NEXT_PUBLIC_APP_ENV` | `production` | oui |
| `NEXT_PUBLIC_POSTHOG_KEY` | clé projet PostHog (optionnel) | oui |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` (optionnel) | oui |
| `POSTHOG_PROJECT_ID` | cadrans /admin (optionnel) | non |
| `POSTHOG_PERSONAL_API_KEY` | scope query:read (optionnel) | non |
| `POSTHOG_API_HOST` | `https://eu.posthog.com` (optionnel) | non |
| `NEXT_PUBLIC_CRISP_WEBSITE_ID` | support chat (optionnel) | oui |
| `DEMO_KEY` | secret — démos prospects `/demo/<slug>?key=` | non |
| `SITE_LOCKED` | `true` pour garder le soft-launch gate, sinon vide | non |
| `PREVIEW_TOKEN` | secret — accès équipe au site verrouillé | non |
| `NEXT_PUBLIC_SITE_URL` | fallback URL canonique (sinon NEXT_PUBLIC_APP_URL) | oui |

Toute variable `NEXT_PUBLIC_*` modifiée exige un **Clear cache and deploy site**.

## L4 — Webhook Stripe

Endpoint : `POST /api/stripe/webhook` (`app/api/stripe/webhook/route.ts`), vérif de signature via
`STRIPE_WEBHOOK_SECRET`. Sans ce secret, l'endpoint renvoie 400 sur tout événement.

Événements réellement traités dans le `switch` (à abonner exactement, pas plus) :

- `identity.verification_session.verified`
- `identity.verification_session.processing`
- `identity.verification_session.requires_input`
- `identity.verification_session.canceled`
- `payment_intent.amount_capturable_updated`  (pré-autorisation posée → bid authorized + email)
- `payment_intent.succeeded`  (supplément Privilège № 001)
- `payment_intent.canceled`  (auth relâchée)
- `payment_intent.payment_failed`  (auth échouée)

Stripe > Developers > Webhooks > Add endpoint → `https://dropno.netlify.app/api/stripe/webhook`,
abonner les 8 événements ci-dessus (ou les familles `identity.verification_session.*` +
`payment_intent.*`), copier le signing secret `whsec_...` dans `STRIPE_WEBHOOK_SECRET` (Netlify, L3),
puis redéployer.

## L6 — Allowlist Auth Supabase

Supabase > Authentication > URL Configuration :

- **Site URL** : `https://dropno.netlify.app` (ou domaine custom une fois posé)
- **Redirect URLs** :
  - `https://dropno.netlify.app/auth/callback`
  - `https://deploy-preview-*--dropno.netlify.app/auth/callback`  (login sur les Deploy Previews)
  - `<domaine-custom>/auth/callback`  (le cas échéant)

Sans ça, OTP / magic link cassent en prod.

## Hors L1/L3/L4/L6 — déjà fait (vérifié en DB le 2026-06-26)

- **L5 scheduler** : `dispatch_ripe_drops_every_minute` est **active=true** et tourne (succeeded chaque
  minute, dernier run 05:36 UTC). Vault contient `service_role_key`, `edge_function_url`, `app_url`,
  `notify_secret`. ROADMAP L5 (« désactivé ») est périmé. Reste juste à purger les drops de test avant
  d'ouvrir un vrai drop (LANCEMENT §3).
- Crons `open_ripe_drops`, `dispatch_reminders`, `expire_serial_offers` : actifs.
  `dispatch_avant_premiere_every_15_min` : inactif (feature avant-première, hors Ligne de tir).
