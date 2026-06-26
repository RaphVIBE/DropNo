# Drop No. — Brief de session Claude Code

*Mis à jour 2026-06-13 après session Cowork (legal, design system, brand assets, Stripe onboarding).*

## Contexte d'entrée

Tu reprends sur un repo Next.js déjà avancé (back-office `/admin` + `/maison` déployé, schéma DB live sur Supabase, edge functions actives, migrations 0001 à 0032+ appliquées). Tu **NE scaffolds RIEN** : tu codes par-dessus l'existant.

Avant de toucher le code, **lis `CLAUDE.md` en entier**. Il contient toutes les décisions verrouillées, les coordonnées Supabase, la stack, et les conventions.

## État au démarrage de cette session

### Foundations posées en Cowork ce mois-ci

| Domaine | État |
|---|---|
| Personne morale Veracruz SRL | ✅ existante, BCE BE 0799.209.229 |
| Domaine dropno.eu | ✅ locké chez Combell |
| Email pro (Google Workspace) | ✅ `raph@dropno.eu` + alias `hello@dropno.eu` |
| DNS auth (SPF/DKIM/DMARC) | ⚠️ DKIM Google OK ; SPF manque `_spf.google.com` (mail-tester 0.7/10) |
| Stripe Connect onboarding | ⏳ en cours, attend les pages légales pour validation |
| Design system locké | ✅ `docs/design/design-system/tokens.css` + `components.md` |
| 4 mockups HTML | ✅ home publique, produit 3 vues, calendrier, révélation |
| Deck marques 12 slides | ✅ `decks/drop-no-presentation-marques.pptx` |
| Drafts légaux 6 docs | ✅ `content/legal/` — à valider juriste avant publication |
| Premier essai éditorial | ✅ `content/essays/vickrey-tresor-clearing-price.md` |
| Cold emails | ✅ `outreach/email_ressence.md`, `email_furlan_marri.md` |

### Ce qui reste à faire pour aller en production

1. Pages légales servies par Next.js (8 routes)
2. SPF DNS fix + mail-tester ≥ 8/10 avant envoi cold outreach
3. Stripe Connect : compléter avec URLs publiques + valider
4. Homepage publique portée depuis mockup HTML vers React/MDX
5. Newsletter signup fonctionnel (Resend audience)
6. Cookie consent banner (granular)

## Priorités de cette session (ordre fixé)

### 🔥 P0 — Bloquer les paiements Stripe

**Tâche 1. Créer les routes légales Next.js**

Pour que Stripe Connect valide l'onboarding, les URLs suivantes doivent résoudre vers un contenu réel :

| Slug Stripe attendu | Source markdown |
|---|---|
| `/privacy-policy` | `content/legal/politique-confidentialite.md` |
| `/terms-of-service` | `content/legal/cgu.md` + lien vers CGV |
| `/cgv` | `content/legal/cgv.md` |
| `/cookies` | `content/legal/politique-cookies.md` |
| `/retractation` | `content/legal/retractation.md` |
| `/mentions-legales` | `content/legal/mentions-legales.md` |
| `/contact` | nouvelle page minimaliste : email hello@dropno.eu + form simple |
| `/cgu` | alias de `/terms-of-service` |
| `/confidentialite` | alias FR de `/privacy-policy` |

Implementation suggérée :
- `app/(legal)/[slug]/page.tsx` qui lit le markdown dans `content/legal/<slug>.md` via gray-matter + remark
- Layout simple : nav top minimale + container max-w-prose + Inter body + Fraunces italic h1/h2
- Aliases FR/EN via `app/(legal)/(fr)/cgu/page.tsx` qui réexporte le rendu de `terms-of-service`
- Style : reprendre les tokens de `docs/design/design-system/tokens.css`

Une fois en place, retourner sur le dashboard Stripe et valider les URLs.

### 🟠 P1 — Sales unlock

**Tâche 2. Fix SPF DNS chez Combell**

Combell → DNS zone → trouver le record TXT `@` SPF. Remplacer par :
```
v=spf1 include:_spf.google.com include:amazonses.com ~all
```
Attendre 15 min. Re-test sur mail-tester.com depuis `raph@dropno.eu` avec un email contenant subject + body. Objectif ≥ 8/10.

**Tâche 3. Page contact + formulaire newsletter**

- `/contact` : email visible, form simple (nom, email, message) → API route qui envoie via Resend à `hello@dropno.eu`
- `/api/newsletter/subscribe` : POST email → Resend Audiences API, doublé d'un email de confirmation

### 🟡 P2 — Homepage publique

**Tâche 4. Porter `docs/design/mockups/dropno-homepage-public.html` vers React**

Le mockup est une référence. Construire dans `app/(public)/page.tsx` les 6 sections :

1. Hero (Drop № wordmark + tagline + meta colonne)
2. Manifeste (3 paragraphes Fraunces italic, fond bg-elev)
3. Drop Calendar (lire de `drops_public` Supabase, fallback "À annoncer" si vide)
4. Lire (3 essai cards, lire depuis `content/essays/*.md`)
5. Newsletter signup (intégré à la tâche 3)
6. Footer

Utiliser les tokens de `docs/design/design-system/tokens.css` portés en Tailwind config.

### 🟢 P3 — Polish frontend

**Tâche 5. Cookie consent banner**

Cookie consent à charger en RSC + client component pour le state :
- 3 catégories : essential (toujours on), functional (Crisp, NEXT_LOCALE), analytics (PostHog)
- Bannière au premier visite, dismissible
- Lien permanent en footer pour ré-ouvrir les préférences

**Tâche 6. Page `/lire/[slug]` avec MDX**

Pour servir l'essai `vickrey-tresor-clearing-price.md` proprement :
- Reader avec measure max 65ch
- Typography Fraunces italic pour h1/h2, Inter pour body
- Citations, blockquotes, code, tables stylisés

## Workflow recommandé

1. Branche feature par tâche (`feature/legal-pages`, `feature/contact-newsletter`, etc.)
2. Commit fréquents en FR
3. À chaque tâche : `npm run build` doit passer, `npm run typecheck` doit passer
4. Test smoke : visiter chaque route ajoutée dans le navigateur avant de marquer la tâche done
5. Quand toutes les pages légales sont up, retour Stripe pour valider l'onboarding

## Quand revenir en Cowork

- Itérer sur les mockups visuels (skill impeccable)
- Réviser les drafts légaux après retour juriste (annotations)
- Discuter stratégie acquisition (next outreach après Ressence/Furlan)
- Générer du contenu éditorial supplémentaire pour `/lire`
- Pitch deck v4 si nouveau angle commercial à tester

## Anti-patterns à éviter

- Re-scaffolder le projet : il existe déjà, ne recrée pas la structure
- Toucher au back-office `/admin` ou `/maison` sans lire `docs/specs/BACKOFFICE.md`
- Modifier les migrations DB sans incrémenter le numéro
- Mettre du contenu publicitaire (RAS de pixel Facebook, RAS de Google Ads)
- Ajouter des em dashes dans la copy utilisateur
- Utiliser `service_role_key` côté client
- Mettre des cookies analytics avant consentement explicite

## Verification de session avant fin

À la fin de cette session, valider :
- [ ] 8 routes légales servent du contenu (curl http://localhost:3000/privacy-policy → 200 OK)
- [ ] SPF mail-tester ≥ 8/10
- [ ] `/contact` form envoie un email réel vers hello@dropno.eu
- [ ] Newsletter signup ajoute à Resend Audiences
- [ ] Homepage publique rend les 6 sections sans erreur
- [ ] Stripe Connect onboarding validé (statut "Active")
