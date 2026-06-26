# Drop No. — ROADMAP (source de vérité unique)

> Board de pilotage du projet. **Tout commence ici.** Avant d'agir, un agent lit ce fichier ; après avoir agi, il met à jour la colonne Statut de sa ligne.
> Remplace et consolide les anciens docs (archivés dans `docs/archive/` : NEXT_STEPS, BUILD_PLAN, BACKOFFICE_GAPS, LANCEMENT).
>
> **Focus en cours : SHIP TO LAUNCH** — la Ligne de tir ci-dessous passe avant tout le reste.
> Dernière mise à jour : 2026-06-26.
> Légende : ✅ fait · 🟡 en cours · ⏳ à faire · ⚠️ à vérifier · 🔴 bloquant
> Priorité : **P0** = bloque le lancement · **P1** = premières semaines · **P2** = confort/scale

---

## 🎯 Ligne de tir — ce qui bloque le lancement (P0)

Le front est largement fini (routes légales, i18n, drops, compte, back-office, serial-offers tous présents). Les blocages restants sont **opérationnels et de correction**, pas du build front.

| # | Item | Domaine | Statut | Note |
|---|---|---|---|---|
| L1 | `STRIPE_SECRET_KEY` posée dans les secrets edge function | ops | ⚠️ (probablement ✅) | Run de clôture du 2026-06-25 passe le garde-fou (plus de « not configured ») → clé lue par close-drop. **Reste ⚠️ tant que non vérifié :** lancer `supabase secrets list --project-ref ygzyzvjxregoqbzmcmyq` et confirmer que `STRIPE_SECRET_KEY` y figure → alors passer L1 en ✅. CLAUDE.md corrigé le 2026-06-26 (« ABSENTE » était périmé). |
| L2 | `close_drop` ne retient que les gagnants `stripe_auth_status='authorized'` | produit-drops | ✅ | Migration **0037** (close_drop v5) **appliquée en prod 2026-06-26**, filtre vérifié live. Tests 30 ✅, critique GO, fix `/admin` livré. |
| L3 | Variables d'env Netlify posées + redéploiement (cache vidé) | ops | ⏳ | Liste exacte figée dans `docs/runbook-lancement.md` (plus complète que l'ancien LANCEMENT). `NEXT_PUBLIC_*` build-time → Clear cache and deploy. |
| L4 | Webhook Stripe branché (`payment_intent.*`, `identity.*`) + signing secret | ops | ⏳ | Handler OK (8 événements identifiés : identity.* + payment_intent.*). Reste : abonner en prod + poser `STRIPE_WEBHOOK_SECRET`. Voir runbook. |
| L5 | ~~Scheduler de clôture activé~~ | ops | ✅ | **Vérifié** : `dispatch_ripe_drops_every_minute` active=true, succeeded en continu. Reste seulement : purge des données de test avant un vrai drop. |
| L6 | Allowlist Auth Supabase (Site URL + redirect URLs prod/preview) | ops | ⏳ | Valeurs exactes dans le runbook. Sinon le magic link / OTP casse en prod. |
| L7 | Test e2e du flux complet sur staging (3 bids → clôture → capture) | produit-drops | 🟡 | Cas L2 (un `pending` ne gagne jamais) couvert en unit. Scénario e2e staging documenté ; bloqué sur L1 + L3. |
| L8 | SPF DNS + mail-tester ≥ 8/10 avant tout cold outreach | croissance | 🟢 | VERT au 2026-06-26. DNS (`check-email-dns.mjs`) : SPF `_spf.google.com` ✅, DKIM Google `google._domainkey` ✅, DMARC `p=none` ✅. **mail-tester = 10/10.** Cold outreach depuis raph@dropno.eu envoyable. Reste DMARC `rua` (non bloquant, à poser avant de durcir en `p=quarantine`). |

**Définition de « prêt à lancer » :** L1→L7 verts + L8 vert pour ouvrir l'outreach. Un drop réel ne s'ouvre qu'après un L7 réussi sur staging.

---

## Swimlanes par domaine

Chaque lane a un agent propriétaire (voir `.claude/agents/`). Statut tenu à jour par l'agent.

### 🛠️ Produit & Drops — `produit-drops`
| Item | P | Statut |
|---|---|---|
| Flux paiement (Stripe Elements, PI manuel, webhook auth) | P0 | ✅ (P1.1–P1.3) |
| **L2** filtre carte autorisée dans `close_drop` | P0 | ✅ migration 0037 appliquée en prod 2026-06-26 |
| **L7** e2e clôture sur staging | P0 | 🟡 unit L2 en place ; e2e en attente d'infra Stripe test |
| Cron invalidation bids `pending` à T‑1h (optionnel — le filtre L2 couvre déjà le risque de capture) | P1 | ⏳ |
| Fix clearing provisoire `/admin` : filtrer aussi `authorized` (sinon admin diverge de close_drop post-0037) | P1 | ✅ (build+tests verts ; effet runtime dépend de 0037 appliquée) |
| Alerte ratio autorisées/actives sur `/admin/cloture` avant T (éviter annulation surprise au reveal) | P2 | ⏳ |
| Animation de révélation à T (depuis `docs/design/mockups/reveal-hero.html`) | P1 | ⏳ |
| Retrait d'offre (UI, RLS/trigger prêts) | P1 | ⏳ |
| Vente partielle (`all_or_nothing`, close_drop v4) | — | ✅ (0032) |
| Privilège № 001 | — | ✅ (0026) |
| Workflow validation drop côté `/maison` (brouillon → validé) | P1 | ⏳ |
| Upload visuels pièces (Supabase Storage vs URLs) | P1 | ⏳ |

### 🌐 Vitrine & Web — `vitrine-web`
| Item | P | Statut |
|---|---|---|
| Routes légales servies (cgu, cgv, privacy, cookies, retractation, mentions) | P0 | ✅ |
| i18n FR/EN (next-intl) | — | ✅ |
| Homepage publique, /drops, /drop/[id], /mecanisme, /marques | — | ✅ |
| Soft-launch gate (consentement + waitlist) | — | ✅ |
| Route éditoriale `/lire` + `/lire/[slug]` (essais, FR-only pour l'instant, note langue sous /en) | — | ✅ |
| Réglages plateforme (`/admin/parametres` : jour/heure drop, plancher, frais, bannière) | P1 | ⏳ |
| SEO technique (sitemap bilingue + hreflang dont essais FR-only canonisés vers FR, JSON-LD Org/WebSite/Product/Article/Breadcrumb, OG fallback `/og-default.png` + Twitter cards) | P1 | ✅ |
| SEO par drop (title/description/OG) | P1 | ✅ |
| Pages d'erreur de marque (404 racine + locale, error.tsx 500, global-error, 403 `/acces-refuse`) + page maintenance 503 (`SITE_MAINTENANCE` toggle, rassure offres) | P1 | ✅ FR+EN, vérifiées preview ; à passer critique a11y |
| Audit design + a11y (passer la critique avant tout changement visible) | continu | 🟡 |

### 📣 Social — `social`
| Item | P | Statut |
|---|---|---|
| Calendrier de publication (source de vérité dédiée) | — | ✅ `social/calendrier-publication.md` (réconcilié vs Buffer 2026-06-26) |
| Cadre de campagne (phasage + semaine-type reveal) | — | ✅ `social/strategie-campagne.md` |
| Feed IG + Reels batch 01 | — | ✅ 6 posts publiés 16-26/06 |
| LinkedIn bilingue jeudi | P1 | 🟡 2 publiés (Grey market, Supreme) ; LI batch-02 à programmer |
| **X / Twitter (canal autonome)** | P1 | 🟡 backlog rattrapé le 26/06 (4 posts programmés, échelonnés) ; reprise auto 19h abandonnée, cadence propre 2-3/sem à installer |
| Posts à programmer (29/06 Royal Oak, 01/07 Speedmaster, 03/07 Sealed…) | P1 | ⏳ batch-02 |
| Profils & bannières (avatar, X, LinkedIn, YouTube) | P2 | 🟡 avatars posés ; bannières + YouTube ⏳ |

### 🤝 Croissance & CRM — `croissance`
| Item | P | Statut |
|---|---|---|
| Emails outreach maisons (Ressence, Furlan Marri, Col&MacArthur, Raidillon) | P1 | 🟡 4 brouillons Gmail propres prêts (URLs `dropno.eu`, clés par maison) ; L8 vert. Reste avant envoi : supprimer 4 vieux brouillons (`in:drafts netlify`), poser vrais destinataires Ressence + Col, envoyer |
| **L8** délivrabilité email avant cold outreach | P0 | 🟢 VERT au 2026-06-26 — DNS (SPF + DKIM Google + DMARC) ✅ + mail-tester 10/10. Cold envoyable |
| Pipeline maisons (`business/Prospection maisons/pipeline.xlsx`) tenu à jour | P1 | 🟡 |
| Pages démo par maison (`/demo/[slug]`) | — | ✅ |
| Newsletter / waitlist (Resend audience) | P1 | 🟡 |
| Relation client : gabarits réponses, triage support | P2 | ⏳ |

### 📦 Ops — Commandes · Logistique · Finance · Analytics — `ops`
| Item | P | Statut |
|---|---|---|
| **L1, L3, L4, L5, L6** infra lancement | P0 | voir Ligne de tir |
| Console de clôture (`/admin/cloture`) | — | ✅ (0021) |
| Finance / payouts maisons (`/admin/finance`) | — | ✅ (0022) |
| Rétractation & refunds (workflow 14j + edge `refund-transaction`) | P1 | ⚠️ dépend de L1 |
| Retours logistique (direction, valeur assurée, tracking) | — | ✅ (0025) |
| Tracking DHL intégré, enlèvements maisons | P1 | ⏳ |
| Analytics PostHog : poser les clés env + valider events (`drop_view`) | P1 | ⏳ clés manquantes |
| Export comptable CSV + base TVA | P2 | ⏳ |
| RGPD : export/suppression compte, registre | P1 | ⏳ |

### 🔒 Sécurité & durcissement — `ops` / owner
| Item | P | Statut |
|---|---|---|
| **Action owner — Activer « Leaked Password Protection » Supabase au passage en plan Pro (toggle Pro-only, verrouillé en Free)** | P2 | ⏳ bloqué — en attente passage Pro |

> **Pourquoi** : l'audit sécurité du 2026-06-26 a relevé l'advisor Supabase « Leaked Password Protection Disabled » (vérification des mots de passe contre HaveIBeenPwned.org pour refuser ceux compromis). **Vérifié avec l'owner le 2026-06-26 : ce toggle est réservé au plan Pro.** Le projet drop-no est en **Free** → le toggle est **verrouillé**, impossible à activer maintenant. Ce n'est donc **pas** une action « à faire tout de suite » mais une action **conditionnée au passage en plan Pro** (idéalement avant le premier drop réel / la bascule prod).
>
> **Piège à éviter** : ne **PAS** contourner en désactivant le grant password / le provider Email. Sous Supabase, le **login OTP 6 chiffres roule sur le provider Email** — couper « Enable email provider » casserait tout le login. Le provider Email **reste ON** ; on attend simplement le plan Pro pour la leaked-password protection.
>
> **Risque résiduel en attendant : faible.** Tous les users sont en OTP (pas de mot de passe à brute-forcer), et les rôles admin passent par des tables séparées (`platform_admins`) non auto-attribuables. Le formulaire `/dev-login` (`signInWithPassword`) n'est dispo qu'en `NODE_ENV != production`.
>
> **Comment (le jour du passage Pro)** : Supabase Dashboard → projet drop-no (`ygzyzvjxregoqbzmcmyq`) → Authentication → Policies / Password settings → activer « Leaked password protection » (déverrouillé une fois en Pro).
>
> **Traçabilité** : le reste de l'audit (authz edge functions `close-drop`/`refund-transaction`, anti-bot alerts/waitlist, fuites `error.message`, fallback sans Stripe en prod) est corrigé, déployé et commité sur la branche `fix/security-hardening` (commit `cbf99e8`, 2026-06-26). Voir mémoire `security-audit-2026-06.md`. Rappel programmé `dropno-leaked-password-protection` recalé au 2026-09-21 (avant le jalon cutover prod `dropno-prod-security-cutover` du 2026-09-28).

### 🔎 Critique — `critique` (panel design · business · marketing · sécurité)
Invoqué **à la demande**, avant qu'une chose sortante ne parte (changement visible, email cold, migration, asset public). Lecture seule, ne modifie rien — rend un verdict + findings. Voir aussi `/code-review`, `/security-review`, skill `web-design-guidelines`.

---

## 🗓️ Rituel de contrôle (rester parallèle sans perdre le fil)

- **Isolation** : un agent qui touche au **code** tourne en worktree (`isolation: worktree`) → pas de collision. Les agents **contenu** (social, croissance, docs) partagent l'arbre.
- **Le board commande** : aucun agent ne part sur un item absent ou non priorisé ici sans le dire. Un agent qui découvre du travail neuf l'ajoute à sa lane avec un statut, il ne le fait pas en douce.
- **Gate de sortie** : tout livrable *sortant* (UI visible, email cold, migration, asset public) passe par `critique` avant ship.
- **Revue hebdo** : une passe qui relit chaque lane, réconcilie les statuts, et re-trie la Ligne de tir. Sortie = ce board, à jour.
- **Décisions verrouillées** : voir `CLAUDE.md` § « Décisions verrouillées » — ne pas re-questionner.
