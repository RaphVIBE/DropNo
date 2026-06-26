# Critique PRD — Plateforme d'Enchères Flash

Audit structuré par sévérité. Focus : trous, risques, incohérences.

---

## 🔴 Critiques bloquantes (à résoudre avant tout)

### 1. Ambiguïté terminologique : « enchère inversée »
Le PRD parle d'« enchère inversée » mais décrit un mécanisme où **les acheteurs surenchérissent** et où le top 100 gagne — c'est une **enchère multi-unités classique (type Dutch/pay-as-bid)**, pas une enchère inversée.

Une enchère inversée réelle = vendeurs/fournisseurs baissent leurs prix pour gagner un acheteur (procurement). Le mismatch va créer de la confusion produit, marketing, et juridique (CGV).

**Action** : choisir et nommer correctement. Probables candidats :
- « Drop avec enchère ascendante multi-gagnants »
- « Enchère pay-as-bid à exemplaires limités »
- « Sealed-bid auction » (offres scellées) si tu veux du suspense type Supreme

### 2. Droit de rétractation EU — risque légal majeur
« Retours non autorisés pour le MVP » : interdit en B2C dans l'UE (directive 2011/83/UE, 14 jours).

L'exemption « public auctions » de l'art. 16(k) **ne s'applique pas aux enchères en ligne** (clarifié par la jurisprudence). Tu seras exposé à des plaintes DGCCRF et à des annulations forcées.

**Action** : consulter un juriste e-commerce EU avant le launch. Options : modèle B2B uniquement, statut « professionnel à professionnel », ou intégration du droit de rétractation dans le flux.

### 3. Pré-autorisation Stripe vs durée d'enchère 7 jours
Une pré-autorisation Stripe **expire entre 7 et 31 jours selon les cartes** ; pour beaucoup de cartes EU, c'est ~7 jours. Avec des enchères de 7 jours, tu es sur le fil — un acheteur qui enchérit le jour 1 risque de voir sa pré-auth expirer le jour 7.

**Action** : durée d'enchère 5 jours max, ou re-capture à J-1, ou modèle « setup intent + capture on win ».

### 4. KYC asymétrique
Seuls les vendeurs sont vérifiés. Pour des montants >€10k, les obligations **AML/LCB-FT** s'appliquent aussi aux **acheteurs** (5e directive UE). Sotheby's, Catawiki, etc. le font tous.

**Action** : KYC acheteurs au-dessus d'un seuil (€1k recommandé pour le luxe).

---

## 🟠 Sections manquantes au PRD

| Section | Pourquoi c'est critique |
|---|---|
| **Non-functional requirements** | SLA disponibilité, latence enchère temps réel, capacité concurrente, sécurité (OWASP), RGPD opérationnel |
| **Out of scope (MVP)** | Évite le scope creep — explicite ce qui n'est PAS dans la v1 |
| **Risk register** | Mentionné comme « next step » mais devrait être intégré dès maintenant |
| **Edge cases** | Égalités d'offres, retrait d'offre, panne paiement, sniping de dernière minute, vendeur défaillant |
| **Anti-sniping** | Auctions classiques étendent de 2-5 min si offre dans les dernières 30s. Absent du PRD. |
| **Analytics / data tracking** | Quels événements suivis ? Mixpanel, PostHog, Amplitude ? |
| **Customer support** | Tu cites un chat (US-19) mais aucun SLA, organigramme, ou outil (Intercom, Zendesk) |
| **Concurrent analysis** | « Première plateforme européenne » est une affirmation forte non sourcée. Catawiki, Drouot Digital, The Watch Pages → benchmark |
| **Monétisation détaillée** | 12% + 5€ fixe — fees acheteur ou vendeur ? TVA ? |
| **Stratégie d'acquisition** | 100 users / 5 marques en Q3 2026 sans plan marketing chiffré |

---

## 🟡 Goals / métriques — réalisme

| Objectif PRD | Problème | Suggestion |
|---|---|---|
| 5 marques en Q3 2026 (3 mois) | Cycles de vente luxe = 6-12 mois | Cibler 2 marques signées + 5 en pipeline |
| 10% conversion | Conversion de quoi ? Visiteur→bidder ? Bidder→winner ? | Définir le funnel (ex : visiteur→inscription 15%, inscription→bid 30%, bid→win 5%) |
| NPS ≥ 70 | Tier Apple/Tesla, irréaliste à 3 mois | NPS ≥ 50 à 6 mois |
| €50K commission Q1 2027 | À 12%, = €416k GMV/mois = ~28 montres à €15k. Réaliste si 5 marques mais tendu | OK si traction marques confirmée |

---

## 🔵 Incohérences techniques

1. **« Firebase OU Supabase »** : choisir. Le folder s'appelle `FlashSales` et tu as déjà Supabase MCP connecté → **Supabase** est probablement le bon choix (Postgres + Realtime + Auth + Storage natifs, RLS pour la sécurité, edge functions).
2. **« Vercel + Firebase Hosting »** : redondant. Vercel pour le front (React/Next), Supabase pour le back. Pas besoin de Firebase Hosting.
3. **« WebSocket OU polling 5s »** : pour des enchères temps réel, **WebSocket (Supabase Realtime)** obligatoire. Polling 5s à 1000 users actifs = 200 req/s côté serveur pour rien.
4. **Pas de CDN mentionné** pour les images produit — critique pour le rendu « premium ». Cloudflare Images ou Bunny CDN.
5. **Concurrence sur les bids** : aucune mention de gestion de race conditions. Il faut row-level locking ou serial transaction sur la table `bids` côté Postgres.

---

## 🟢 User stories — gaps & améliorations

**Personas manquants** : admin/modérateur, support, expert authentification.

**Stories manquantes** :
- *Vendeur onboarding* (signature contrat, KYC, premier listing)
- *Litiges* (acheteur conteste l'authenticité, vendeur n'expédie pas)
- *Bid withdrawal* (autorisé ? sous quelles conditions ?)
- *Anti-sniping* (extension automatique en fin d'enchère)
- *Première visite anonyme* (que voit un visiteur non-inscrit ?)
- *Vendeur perd ses gagnants* (un top-100 backout après gain)

**Critères d'acceptation à durcir** :
- US-05 « +10% par rapport à l'offre précédente » : sur une montre à €15k, +10% = +€1500/bid, trop steep. Préférer incréments dynamiques par paliers (ex : +€100 sous €5k, +€500 sous €25k, +€1000 au-delà).
- US-06 « toutes les 5s » : remplacer par push WebSocket.
- US-07 : ajouter rate-limiting (un user qui bid 50x ne reçoit pas 50 notifs/min).
- US-11 : préciser intégration tracking (Aftership, EasyPost).

---

## ⚪ Design / branding

- **Nom du projet** : encore TBD. Le folder est `FlashSales` mais le PRD propose `ExclusivBid/RarityAuction`. Trancher tôt — impacte naming domaine, marque, communication.
- **Palette « doré #d97706 »** : c'est plus orange/ambre que doré. Pour du AP-luxe, viser un champagne désaturé (`#c9a96e`) ou un or rosé (`#b76e79`). Ou retirer le doré complètement (Supreme/AP n'utilisent pas vraiment d'accents dorés — c'est plutôt eBay Premium).
- **Inter + Helvetica Neue** : pairing redondant (deux sans-serif géométriques). Pour du AP-luxe, considérer un serif éditorial en titres (Cormorant, Editorial New, GT Sectra) et garder Inter pour le corps.
- **« Pas de publicités »** : pas une contrainte design, à déplacer dans business model.
- **Pas de mention dark mode** alors que tout le branding (noir, doré) suggère un design sombre par défaut.

---

## 📋 Next steps recommandés (par ordre)

1. **Résoudre l'ambiguïté terminologique** (point 🔴 #1) — impacte tout le reste.
2. **Consultation juridique EU** : rétractation, KYC, AML, CGV. Avant toute ligne de code.
3. **Trancher la stack** : Supabase + Vercel + Stripe. Documenter dans le PRD.
4. **Ajouter sections manquantes** : NFR, out-of-scope, risk register, edge cases, anti-sniping.
5. **Benchmark concurrentiel** : Catawiki (€800M GMV/an), Drouot Digital, eBay Luxury, The RealReal — pour positionnement et pricing.
6. **Maquettes Figma** des 3 écrans clés (home, page produit, dashboard) avant tout code.
7. **Définir le funnel d'acquisition** : où vont les 100 premiers users ? Influenceurs montres (Instagram, YouTube), Reddit r/watches, communautés Discord ?

---

## 🎯 Points forts à conserver

- Structure documentaire claire (vision → users → AC → contraintes).
- Vision premium cohérente avec inspirations citées.
- Identification correcte des 3 personas clés.
- Stack moderne et raisonnable pour un MVP.
- Conscience explicite des enjeux RGPD/KYC (même si à approfondir).
